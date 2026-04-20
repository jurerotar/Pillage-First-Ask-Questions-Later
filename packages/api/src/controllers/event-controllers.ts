import { z } from 'zod';
import { calculateBuildingCancellationRefundForLevel } from '@pillage-first/game-assets/utils/buildings';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { triggerKick } from '../scheduler/scheduler-signal';
import { createController } from '../utils/controller';
import { getEffectiveNow } from '../utils/game-time';
import {
  selectAllVillageEventsByTypeQuery,
  selectAllVillageEventsQuery,
  selectEventByIdQuery,
  selectEventsByTypeQuery,
  selectTroopMovementEventsQuery,
} from '../utils/queries/event-queries';
import { resolveEvent } from '../utils/resolver';
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
  createEvents(database, body);
});

export const getCurrentGameTime = createController('/events/current-time')(
  ({ database }) => {
    return {
      currentTime: getEffectiveNow(database),
    };
  },
);

export const getVacationModeStatus = createController('/events/vacation')(
  ({ database }) => {
    const isVacationModeEnabled =
      database.selectValue({
        sql: `
          SELECT vacation_started_at
          FROM
            meta
          LIMIT 1;
        `,
        schema: z.number().nullable(),
      }) !== null;

    return {
      isVacationModeEnabled,
    };
  },
);

const metaStateSchema = z.strictObject({
  lastWrite: z.number(),
  vacationStartedAt: z.number().nullable(),
  totalTimeSkipped: z.number(),
});

export const enableVacationMode = createController(
  '/events/vacation',
  'post',
)(({ database }) => {
  database.exec({
    sql: `
        UPDATE meta
        SET
          vacation_started_at = CAST(unixepoch('subsec') * 1000 AS INTEGER),
          last_write = CAST(unixepoch('subsec') * 1000 AS INTEGER);
      `,
  });
});

export const disableVacationMode = createController(
  '/events/vacation',
  'delete',
)(({ database }) => {
  database.transaction((db) => {
    const meta = db.selectObject({
      sql: `
        SELECT
          last_write AS lastWrite,
          vacation_started_at AS vacationStartedAt,
          total_time_skipped AS totalTimeSkipped
        FROM
          meta
        LIMIT 1;
      `,
      schema: metaStateSchema,
    })!;

    if (meta.vacationStartedAt === null) {
      return;
    }

    const vacationDuration = Date.now() - meta.vacationStartedAt;

    db.exec({
      sql: `
        UPDATE events
        SET
          starts_at = starts_at + $vacation_duration
        WHERE
          resolves_at > $game_now;
      `,
      bind: {
        $vacation_duration: vacationDuration,
        $game_now: meta.lastWrite + meta.totalTimeSkipped,
      },
    });

    db.exec({
      sql: `
        UPDATE meta
        SET
          vacation_started_at = NULL,
          last_write = CAST(unixepoch('subsec') * 1000 AS INTEGER);
      `,
    });
  });

  triggerKick();
});

export const skipTime = createController(
  '/events/skip-time',
  'post',
)(({ database, body }) => {
  const duration = z
    .strictObject({
      duration: z.number().int().min(1),
    })
    .parse(body).duration;

  database.transaction((db) => {
    db.exec({
      sql: `
          UPDATE meta
          SET
            total_time_skipped = total_time_skipped + $duration;
        `,
      bind: {
        $duration: duration,
      },
    });
  });

  const effectiveNow = getEffectiveNow(database);

  const dueEventIds = database.selectValues({
    sql: `
        SELECT id
        FROM
          events
        WHERE
          resolves_at <= $effective_now
        ORDER BY
          resolves_at;
      `,
    bind: {
      $effective_now: effectiveNow,
    },
    schema: z.number(),
  });

  for (const id of dueEventIds) {
    database.transaction((db) => {
      resolveEvent(db, id);
    });
  }

  triggerKick();
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
