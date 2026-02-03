import { z } from 'zod';
import { calculateBuildingCancellationRefundForLevel } from '@pillage-first/game-assets/buildings/utils';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { triggerKick } from '../scheduler/scheduler-signal';
import type { Controller } from '../types/controller';
import {
  selectAllVillageEventsByTypeQuery,
  selectAllVillageEventsQuery,
  selectEventByIdQuery,
} from '../utils/queries/event-queries';
import { addVillageResourcesAt, demolishBuilding } from '../utils/village';
import { eventSchema } from '../utils/zod/event-schemas';
import { createEvents } from './utils/create-event.ts';
import { getEventStartTime } from './utils/events.ts';

/**
 * GET /villages/:villageId/events
 * @pathParam {number} villageId
 */
export const getVillageEvents: Controller<'/villages/:villageId/events'> = (
  database,
  { params },
) => {
  const { villageId } = params;

  return database.selectObjects({
    sql: selectAllVillageEventsQuery,
    bind: {
      $village_id: villageId,
    },
    schema: eventSchema,
  });
};

/**
 * GET /villages/:villageId/events/:eventType
 * @pathParam {number} villageId
 * @pathParam {string} eventType
 */
export const getVillageEventsByType: Controller<
  '/villages/:villageId/events/:eventType'
> = (database, { params }) => {
  const { villageId, eventType } = params;

  return database.selectObjects({
    sql: selectAllVillageEventsByTypeQuery,
    bind: {
      $village_id: villageId,
      $type: eventType,
    },
    schema: eventSchema,
  });
};

type CreateNewEventsBody = Omit<GameEvent, 'id' | 'startsAt' | 'duration'> & {
  amount: number;
};

/**
 * POST /events
 * @bodyContent application/json CreateNewEventsBody
 * @bodyRequired
 */
export const createNewEvents: Controller<
  '/events',
  'post',
  CreateNewEventsBody
> = (database, { body }) => {
  createEvents(database, body);
};

/**
 * DELETE /events/:eventId
 * @pathParam {string} eventId
 */
export const cancelConstructionEvent: Controller<
  '/events/:eventId',
  'delete'
> = (database, args) => {
  const {
    params: { eventId },
  } = args;

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
      const resourcesToRefund = calculateBuildingCancellationRefundForLevel(
        buildingId,
        level,
      );

      addVillageResourcesAt(db, villageId, Date.now(), resourcesToRefund);
    }
  });

  triggerKick();
};
