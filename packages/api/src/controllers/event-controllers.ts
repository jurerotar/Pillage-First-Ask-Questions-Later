import { z } from 'zod';
import { calculateBuildingCancellationRefundForLevel } from '@pillage-first/game-assets/utils/buildings';
import { calculateUnitUpgradeCostForLevel } from '@pillage-first/game-assets/utils/units';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Unit } from '@pillage-first/types/models/unit';
import { triggerKick } from '../scheduler/scheduler-signal';
import { createController } from '../utils/controller';
import {
  selectAllVillageEventsByTypeQuery,
  selectAllVillageEventsQuery,
  selectEventByIdQuery,
  selectEventsByTypeQuery,
  selectTroopMovementEventsQuery,
} from '../utils/queries/event-queries';
import { addVillageResourcesAt, demolishBuilding } from '../utils/village';
import { eventSchema } from '../utils/zod/event-schemas';
import { createEvents } from './utils/create-event';
import { getEventStartTime } from './utils/events';
export const getVillageEvents = createController('/villages/:villageId/events')(
  ({ database, path: { villageId } }) => {
    return database.selectObjects({
      sql: selectAllVillageEventsQuery,
      bind: {
        $village_id: villageId,
      },
      schema: eventSchema,
    });
  },
);

export const getVillageEventsByType = createController(
  '/villages/:villageId/events/:eventType',
)(({ database, path: { villageId, eventType } }) => {
  if (eventType === 'troopMovement') {
    return database.selectObjects({
      sql: selectTroopMovementEventsQuery,
      bind: {
        $village_id: villageId,
      },
      schema: eventSchema,
    });
  }

  if (eventType === 'unitImprovement') {
    return database.selectObjects({
      sql: selectEventsByTypeQuery,
      bind: {
        $type: eventType,
      },
      schema: eventSchema,
    });
  }

  return database.selectObjects({
    sql: selectAllVillageEventsByTypeQuery,
    bind: {
      $village_id: villageId,
      $type: eventType,
    },
    schema: eventSchema,
  });
});

export const createNewEvents = createController(
  '/events',
  'post',
)(({ database, body }) => {
  createEvents(database, body!);
});

export const cancelConstructionEvent = createController(
  '/events/:eventId',
  'delete',
)(({ database, path: { eventId } }) => {
  database.transaction((db) => {
    const cancelledEvent = db.selectObject({
      sql: selectEventByIdQuery,
      bind: {
        $event_id: eventId,
      },
      schema: eventSchema,
    })! as GameEvent<'buildingLevelChange'>;

    const { level, buildingId, villageId, buildingFieldId, resolvesAt } =
      cancelledEvent;

    // Delete this event and all future events on the same building fields
    const cancelledScheduledEvents = db.selectObjects({
      sql: `
        DELETE
        FROM
          events
        WHERE
          village_id = $village_id
          AND JSON_EXTRACT(events.meta, '$.buildingFieldId') = $building_field_id
          AND resolves_at >= $resolves_at
        RETURNING
          JSON_EXTRACT(events.meta, '$.buildingFieldId') AS buildingFieldId,
          JSON_EXTRACT(events.meta, '$.level') AS level;
        ;
      `,
      bind: {
        $village_id: villageId,
        $building_field_id: buildingFieldId,
        $resolves_at: resolvesAt,
      },
      schema: z.strictObject({
        buildingFieldId: z.number(),
        level: z.number(),
      }),
    });

    for (const { buildingFieldId, level } of cancelledScheduledEvents) {
      // If building is currently upgrading to level 1, we need to demolish it
      if (level === 1) {
        demolishBuilding(db, villageId, buildingFieldId);
      }
    }

    // Remaining building events now need to have their start times adjusted.
    // Only scheduled construction events need adjusting, since any ongoing events are already ongoing.
    const scheduledEvents = db.selectObjects({
      sql: selectAllVillageEventsByTypeQuery,
      bind: {
        $village_id: villageId,
        $type: 'buildingScheduledConstruction',
      },
      schema: eventSchema,
    });

    for (const event of scheduledEvents) {
      const startsAt = getEventStartTime(db, event);

      db.exec({
        sql: `
          UPDATE events
          SET
            starts_at = $starts_at
          WHERE
            id = $event_id;
        `,
        bind: {
          $event_id: event.id,
          $starts_at: startsAt,
        },
      });
    }

    // If event is already ongoing, refund resources
    if (cancelledEvent.type === 'buildingLevelChange') {
      const now = Date.now();
      const duration = cancelledEvent.resolvesAt - cancelledEvent.startsAt;
      const elapsed = Math.max(0, now - cancelledEvent.startsAt);
      const completionPercentage =
        duration > 0 ? Math.min(1, elapsed / duration) : 1;

      const resourcesToRefund = calculateBuildingCancellationRefundForLevel(
        buildingId,
        level,
        completionPercentage,
      );

      addVillageResourcesAt(db, villageId, now, resourcesToRefund);
    }
  });

  triggerKick();
});

export const cancelUnitImprovementEvent = createController(
  '/events/unit-improvement-event/:eventId',
  'delete',
)(({ database, path: { eventId } }) => {
  database.transaction((db) => {
    const cancelledEvent = db.selectObject({
      sql: selectEventByIdQuery,
      bind: {
        $event_id: eventId,
      },
      schema: eventSchema,
    })! as GameEvent<'unitImprovement'>;

    // Delete this event and all future events on the same units
    const cancelledEvents = db.selectObjects({
      sql: `
        DELETE
        FROM
          events
        WHERE
          JSON_EXTRACT(events.meta, '$.unitId') = $unitId
          AND JSON_EXTRACT(events.meta, '$.level') >= $level
        RETURNING
          village_id AS villageId,
          JSON_EXTRACT(events.meta, '$.unitId') AS unitId,
          JSON_EXTRACT(events.meta, '$.level') AS level;
        ;
      `,
      bind: {
        $unitId: cancelledEvent.unitId,
        $level: cancelledEvent.level,
      },
      schema: z.strictObject({
        villageId: z.number(),
        unitId: z.string() as z.ZodType<Unit['id']>,
        level: z.number(),
      }),
    });

    cancelledEvents.forEach((cancelledEvent) => {
      const resourcesToRefund = calculateUnitUpgradeCostForLevel(
        cancelledEvent.unitId,
        cancelledEvent.level,
      );
      addVillageResourcesAt(
        db,
        cancelledEvent.villageId,
        Date.now(),
        resourcesToRefund,
      );
    });
  });
  triggerKick();
});

export const cancelDemolitionEvent = createController(
  '/villages/:villageId/events/demolition',
  'delete',
)(({ database, path: { villageId } }) => {
  database.transaction((db) => {
    const demolitionEvent = db.selectObject({
      sql: `
        DELETE
        FROM
          events
        WHERE
          id = (
            SELECT
              id
            FROM
              events
            WHERE
              village_id = $village_id
              AND (
                type = 'buildingDestruction'
                OR (
                  type = 'buildingLevelChange'
                  AND CAST(JSON_EXTRACT(meta, '$.previousLevel') AS INTEGER) >
                    CAST(JSON_EXTRACT(meta, '$.level') AS INTEGER)
                )
              )
            ORDER BY
              resolves_at
            LIMIT 1
          )
        RETURNING
          id;
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.strictObject({
        id: z.number(),
      }),
    });

    if (!demolitionEvent) {
      throw new Error('Demolition event not found');
    }
  });

  triggerKick();
});
