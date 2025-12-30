import { z } from 'zod';
import { calculateBuildingCancellationRefundForLevel } from '@pillage-first/game-assets/buildings/utils';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { triggerKick } from '../scheduler/scheduler-signal';
import type { ApiHandler } from '../types/handler';
import {
  selectAllVillageEventsByTypeQuery,
  selectAllVillageEventsQuery,
  selectEventByIdQuery,
} from '../utils/queries/event-queries';
import { addVillageResourcesAt, demolishBuilding } from '../utils/village';
import {
  eventSchema,
  parseEvent,
  parseEvents,
} from '../utils/zod/event-schemas';
import { createEvents } from './utils/create-event';
import { getEventStartTime } from './utils/events';

const eventListSchema = z.array(eventSchema);

export const getVillageEvents: ApiHandler<'villageId'> = (
  database,
  { params },
) => {
  const { villageId } = params;

  const rows = database.selectObjects(selectAllVillageEventsQuery, {
    $village_id: villageId,
  });

  return eventListSchema.parse(rows);
};

export const getVillageEventsByType: ApiHandler<'villageId' | 'eventType'> = (
  database,
  { params },
) => {
  const { villageId, eventType } = params;

  const rows = database.selectObjects(selectAllVillageEventsByTypeQuery, {
    $village_id: villageId,
    $type: eventType,
  });

  return eventListSchema.parse(rows);
};

type CreateNewEventsBody = Omit<GameEvent, 'id' | 'startsAt' | 'duration'> & {
  amount: number;
};

export const createNewEvents: ApiHandler<'', CreateNewEventsBody> = (
  database,
  args,
) => {
  const { body } = args;

  createEvents(database, body);
};

export const cancelConstructionEvent: ApiHandler<'eventId', void> = (
  database,
  args,
) => {
  const {
    params: { eventId },
  } = args;

  database.transaction((db) => {
    const cancelledEventRow = db.selectObject(selectEventByIdQuery, {
      $event_id: eventId,
    });

    const cancelledEvent = parseEvent<'buildingLevelChange'>(cancelledEventRow);

    const { level, buildingId, villageId, buildingFieldId, resolvesAt } =
      cancelledEvent;

    // Delete this event and all future events on the same building fields
    const cancelledScheduledEvents = db.selectObjects(
      `
        DELETE
        FROM events
        WHERE village_id = $village_id
          AND JSON_EXTRACT(events.meta, '$.buildingFieldId') = $building_field_id
          AND resolves_at >= $resolves_at
        RETURNING
          JSON_EXTRACT(events.meta, '$.buildingFieldId') AS buildingFieldId,
          JSON_EXTRACT(events.meta, '$.level') AS level;
        ;
      `,
      {
        $village_id: villageId,
        $building_field_id: buildingFieldId,
        $resolves_at: resolvesAt,
      },
    ) as { buildingFieldId: number; level: number }[];

    for (const { buildingFieldId, level } of cancelledScheduledEvents) {
      // If building is currently upgrading to level 1, we need to demolish it
      if (level === 1) {
        demolishBuilding(db, villageId, buildingFieldId);
      }
    }

    // Remaining building events now need to have their start times adjusted.
    // Only scheduled construction events need adjusting, since any ongoing events are already ongoing.
    const scheduledConstructionRows = db.selectObjects(
      selectAllVillageEventsByTypeQuery,
      {
        $village_id: villageId,
        $type: 'buildingScheduledConstruction',
      },
    );

    const scheduledEvents = parseEvents<'buildingScheduledConstruction'>(
      scheduledConstructionRows,
    );

    for (const event of scheduledEvents) {
      const startsAt = getEventStartTime(db, event);

      db.exec(
        `
          UPDATE events
          SET starts_at = $starts_at
          WHERE id = $event_id;
        `,
        {
          $event_id: event.id,
          $starts_at: startsAt,
        },
      );
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
