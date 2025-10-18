import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { getGameEventResolver } from 'app/(game)/api/utils/event-type-mapper';
import { updateVillageResourcesAt } from 'app/(game)/api/utils/village';
import type { EventApiNotificationEvent } from 'app/interfaces/api';
import type { DbFacade } from 'app/(game)/api/database-facade';
import { eventSchema } from 'app/(game)/api/utils/zod/event-schemas';
import { getEventCost } from 'app/(game)/api/handlers/utils/events';

let scheduledTimeout: number | null = null;

const resolveEvent = (database: DbFacade, eventId: GameEvent['id']) => {
  const row = database.selectObject(
    `
        SELECT id, type, starts_at, duration, village_id, resolves_at, meta
        FROM events
        WHERE id = $id;
      `,
    {
      $id: eventId,
    },
  );

  const event = eventSchema.parse(row);

  const eventCost = getEventCost(event);

  if (eventCost.some((cost) => cost > 0)) {
    updateVillageResourcesAt(
      database,
      event.villageId,
      event.startsAt + event.duration,
    );
  }

  try {
    const resolver = getGameEventResolver(event.type);

    resolver(database, event);

    database.exec(
      `
        DELETE
        FROM events
        WHERE id = $id;
      `,
      {
        $id: eventId,
      },
    );

    self.postMessage({
      eventKey: 'event:worker-event-resolve-success',
      ...event,
    } satisfies EventApiNotificationEvent);
  } catch (error) {
    console.error(error);
    self.postMessage({
      eventKey: 'event:worker-event-resolve-error',
      ...event,
    } satisfies EventApiNotificationEvent);
  }
};

export const scheduleNextEvent = (database: DbFacade) => {
  if (scheduledTimeout !== null) {
    self.clearTimeout(scheduledTimeout);
    scheduledTimeout = null;
  }

  while (true) {
    const pastEventIds = database.selectValues(
      `
        SELECT id
        FROM events
        WHERE resolves_at <= $now
        ORDER BY resolves_at;
      `,
      {
        $now: Date.now(),
      },
    ) as GameEvent['id'][];

    if (pastEventIds.length === 0) {
      break;
    }

    database.transaction((db) => {
      for (const id of pastEventIds) {
        resolveEvent(db, id);
      }
    });
  }

  const next = database.selectObject(
    `
      SELECT id, resolves_at as resolvesAt
      FROM events
      WHERE resolves_at > $now
      ORDER BY resolves_at
      LIMIT 1;
    `,
    {
      $now: Date.now(),
    },
  ) as Pick<GameEvent, 'id' | 'resolvesAt'>;

  if (!next) {
    return;
  }

  const delay = Math.max(0, next.resolvesAt - Date.now());

  scheduledTimeout = self.setTimeout(() => {
    scheduledTimeout = null;
    resolveEvent(database, next.id);
    scheduleNextEvent(database);
  }, delay);
};
