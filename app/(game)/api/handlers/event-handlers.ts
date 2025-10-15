import type { ApiHandler } from 'app/interfaces/api';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { scheduleNextEvent } from 'app/(game)/api/utils/event-resolvers';
import { partition } from 'app/utils/common';
import { isBuildingEvent } from 'app/(game)/guards/event-guards';
import { calculateBuildingCancellationRefundForLevel } from 'app/assets/utils/buildings';
import {
  addVillageResourcesAt,
  demolishBuilding,
} from 'app/(game)/api/utils/village';
import { createClientEvents } from 'app/(game)/api/handlers/utils/create-event';
import { getCurrentPlayer } from 'app/(game)/api/utils/player';
import { eventSchema } from 'app/(game)/api/utils/zod/event-schemas';
import { z } from 'zod';
import {
  selectAllVillageEventsByTypeQuery,
  selectAllVillageEventsQuery,
  selectVillageBuildingEventsQuery,
} from 'app/(game)/api/utils/queries/event-queries';

const eventListSchema = z.array(eventSchema);

export const getVillageEvents: ApiHandler<
  z.infer<typeof eventSchema>[],
  'villageId'
> = (database, { params }) => {
  const { villageId } = params;

  const rows = database.selectObjects(selectAllVillageEventsQuery, {
    $village_id: villageId,
  });

  return eventListSchema.parse(rows);
};

export const getVillageEventsByType: ApiHandler<
  z.infer<typeof eventSchema>[],
  'villageId' | 'eventType'
> = (database, { params }) => {
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

export const createNewEvents: ApiHandler<void, '', CreateNewEventsBody> = (
  database,
  args,
) => {
  const { body } = args;

  createClientEvents(database, body);
};

export const cancelConstructionEvent: ApiHandler<void, 'eventId', void> = (
  database,
  args,
) => {
  const {
    params: { eventId },
  } = args;

  const { tribe } = getCurrentPlayer(database);

  database.transaction((db) => {
    const cancelledRow = db.selectObject(
      `
        SELECT id, type, starts_at, duration, resolves_at, meta, village_id
        FROM events
        WHERE id = $eventId
      `,
      { $eventId: eventId },
    );

    if (!cancelledRow) {
      return;
    }

    const cancelledEvent = eventSchema.parse(
      cancelledRow,
    ) as GameEvent<'buildingConstruction'>;

    const rows = db.selectObjects(selectVillageBuildingEventsQuery, {
      $village_id: cancelledEvent.villageId,
    });
    const allVillageEvents = z.array(eventSchema).parse(rows);

    // If there's other building upgrades of same building, we need to cancel them as well
    const [eventsToRemove, eventsToKeep] = partition(
      allVillageEvents,
      (event) => {
        if (!isBuildingEvent(event)) {
          return false;
        }

        return (
          cancelledEvent.villageId === event.villageId &&
          cancelledEvent.buildingFieldId === event.buildingFieldId &&
          cancelledEvent.startsAt <= event.startsAt
        );
      },
    );

    if (eventsToRemove.length === 0) {
      return; // Nothing to remove
    }

    // There's always going to be at least one event, but if there's more, we take the last one, so that we can subtract the right amount
    const eventToRemove = eventsToRemove.at(
      -1,
    ) as GameEvent<'buildingConstruction'>;

    const { buildingFieldId, buildingId, level, villageId } = eventToRemove;

    const buildingEvents = eventsToKeep.filter(isBuildingEvent);

    // Romans effectively have 2 queues, so we only limit ourselves to the relevant one
    const eligibleEvents =
      tribe === 'romans'
        ? buildingEvents.filter((event) => {
            if (buildingFieldId <= 18) {
              return event.buildingFieldId <= 18;
            }

            return event.buildingFieldId > 18;
          })
        : buildingEvents;

    // If we're building a new building (level 0 -> 1), remove the building on cancel
    if (level === 1) {
      demolishBuilding(db, villageId, buildingFieldId);
    }

    const now = Date.now();

    // Remove all selected events (the cancelled one and chained upgrades for the same field)
    {
      const idsToRemove = eventsToRemove.map((e) => e.id);
      if (idsToRemove.length > 0) {
        const placeholders = idsToRemove.map((_, i) => `$id${i}`).join(',');
        const bind = Object.fromEntries(
          idsToRemove.map((v, i) => [`$id${i}`, v]),
        );
        db.exec(`DELETE FROM events WHERE id IN (${placeholders})`, bind);
      }
    }

    // Determine the base start time for scheduled events in the same (roman-aware) queue
    const activeInQueue = eligibleEvents.find(
      (e) => e.startsAt <= now && now < e.startsAt + e.duration,
    );
    let nextStart = activeInQueue
      ? activeInQueue.startsAt + activeInQueue.duration
      : now;

    // Reschedule remaining scheduled events in this queue to start as soon as possible (contiguously)
    const scheduledInQueue = eligibleEvents
      .filter((e) => e.startsAt > now)
      .toSorted((a, b) => a.startsAt - b.startsAt);

    for (const e of scheduledInQueue) {
      if (e.startsAt !== nextStart) {
        db.exec('UPDATE events SET starts_at = $startsAt WHERE id = $id', {
          $startsAt: nextStart,
          $id: e.id,
        });
      }
      nextStart += e.duration;
    }

    const resourcesToRefund = calculateBuildingCancellationRefundForLevel(
      buildingId,
      level,
    );

    addVillageResourcesAt(db, villageId, Date.now(), resourcesToRefund);
  });

  scheduleNextEvent(database);
};
