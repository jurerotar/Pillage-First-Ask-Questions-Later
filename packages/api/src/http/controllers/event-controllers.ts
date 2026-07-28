import { z } from 'zod';
import { calculateBuildingCancellationRefundForLevel } from '@pillage-first/game-assets/utils/buildings';
import { calculateUnitUpgradeCostForLevel } from '@pillage-first/game-assets/utils/units';
import {
  baseEventDtoSchema,
  createEventDtoSchema,
} from '@pillage-first/types/dtos/event';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { gameEventTypeSchema } from '@pillage-first/types/models/game-event';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import {
  deleteNextDemolitionEventQuery,
  deleteUnitImprovementEventsFromLevelQuery,
  selectAllVillageEventsByTypeQuery,
  selectAllVillageEventsQuery,
  selectAllVillageResourceTransferEventsQuery,
  selectEventByIdQuery,
  selectEventsByTypeQuery,
  selectTroopMovementEventsQuery,
} from '../../queries/event-queries';
import { removeBuildingPlaceholder } from '../../utils/building-placeholder';
import { createEvents } from '../../utils/create-event';
import { processScheduledBuildingUpgrades } from '../../utils/scheduled-building-upgrades';
import { addVillageResourcesAt } from '../../utils/village';
import {
  baseEventRowSchema,
  mapEventRowToTypedEvent,
} from '../../utils/zod/event-schemas';
import { createController } from '../controller';
import { triggerKick } from '../events/scheduler/scheduler-signal';

export const getVillageEvents = createController(
  '/villages/:villageId/events',
  {
    summary: 'Get village events',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: z.array(baseEventDtoSchema),
  },
)(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
    sql: selectAllVillageEventsQuery,
    bind: {
      $village_id: villageId,
    },
    schema: baseEventRowSchema,
  });

  return rows.map(mapEventRowToTypedEvent);
});

export const getVillageEventsByType = createController(
  '/villages/:villageId/events/:eventType',
  {
    summary: 'Get village events by type',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
        eventType: z.union([gameEventTypeSchema, z.literal('troopMovement')]),
      }),
    },
    response: z.array(baseEventDtoSchema),
  },
)(({ database, path: { villageId, eventType } }) => {
  if (eventType === 'troopMovement') {
    const rows = database.selectObjects({
      sql: selectTroopMovementEventsQuery,
      bind: {
        $village_id: villageId,
      },
      schema: baseEventRowSchema,
    });

    return rows.map(mapEventRowToTypedEvent);
  }

  if (eventType === 'unitImprovement') {
    const rows = database.selectObjects({
      sql: selectEventsByTypeQuery,
      bind: {
        $type: eventType,
      },
      schema: baseEventRowSchema,
    });

    return rows.map(mapEventRowToTypedEvent);
  }

  if (eventType === 'resourceTransfer') {
    const rows = database.selectObjects({
      sql: selectAllVillageResourceTransferEventsQuery,
      bind: {
        $village_id: villageId,
      },
      schema: baseEventRowSchema,
    });

    return rows.map(mapEventRowToTypedEvent);
  }

  const rows = database.selectObjects({
    sql: selectAllVillageEventsByTypeQuery,
    bind: {
      $village_id: villageId,
      $type: eventType,
    },
    schema: baseEventRowSchema,
  });

  return rows.map(mapEventRowToTypedEvent);
});

export const createNewEvents = createController('/events', 'post', {
  summary: 'Create new events',
  requestBody: createEventDtoSchema,
})(({ database, body }) => {
  createEvents(database, body as never);
});

export const cancelConstructionEvent = createController(
  '/events/:eventId',
  'delete',
  {
    summary: 'Cancel event',
    requestParams: {
      path: z.strictObject({
        eventId: z.string(),
      }),
    },
  },
)(({ database, path: { eventId } }) => {
  database.transaction((db) => {
    const cancelledEventRow = db.selectObject({
      sql: selectEventByIdQuery,
      bind: {
        $event_id: eventId,
      },
      schema: baseEventRowSchema,
    });

    const cancelledEvent = mapEventRowToTypedEvent(
      cancelledEventRow!,
    ) as GameEvent<'buildingLevelChange'>;

    const { level, buildingId, villageId, buildingFieldId } = cancelledEvent;

    db.exec({
      sql: 'DELETE FROM events WHERE id = $event_id;',
      bind: {
        $event_id: cancelledEvent.id,
      },
    });

    db.exec({
      sql: `
        DELETE FROM scheduled_building_upgrades
        WHERE village_id = $village_id
          AND building_field_id = $building_field_id;
      `,
      bind: {
        $village_id: villageId,
        $building_field_id: buildingFieldId,
      },
    });

    if (level === 1) {
      removeBuildingPlaceholder(db, villageId, buildingFieldId, buildingId);
    }

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
    processScheduledBuildingUpgrades(db, villageId);
  });

  triggerKick();
});

export const cancelUnitImprovementEvent = createController(
  '/events/unit-improvement-event/:eventId',
  'delete',
  {
    summary: 'Cancel unit improvement event',
    requestParams: {
      path: z.strictObject({
        eventId: z.string(),
      }),
    },
  },
)(({ database, path: { eventId } }) => {
  database.transaction((db) => {
    const cancelledEventRow = db.selectObject({
      sql: selectEventByIdQuery,
      bind: {
        $event_id: eventId,
      },
      schema: baseEventRowSchema,
    });

    const cancelledEvent = mapEventRowToTypedEvent(
      cancelledEventRow!,
    ) as GameEvent<'unitImprovement'>;

    // Delete this event and all future events on the same units
    const cancelledEvents = db.selectObjects({
      sql: deleteUnitImprovementEventsFromLevelQuery,
      bind: {
        $unit_id: cancelledEvent.unitId,
        $level: cancelledEvent.level,
      },
      schema: z.strictObject({
        villageId: z.number(),
        unitId: unitIdSchema,
        level: z.number(),
      }),
    });

    for (const cancelledEvent of cancelledEvents) {
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
    }
  });

  triggerKick();
});

export const cancelDemolitionEvent = createController(
  '/villages/:villageId/events/demolition',
  'delete',
  {
    summary: 'Cancel demolition event',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
  },
)(({ database, path: { villageId } }) => {
  database.exec({
    sql: deleteNextDemolitionEventQuery,
    bind: {
      $village_id: villageId,
    },
  });

  triggerKick();
});
