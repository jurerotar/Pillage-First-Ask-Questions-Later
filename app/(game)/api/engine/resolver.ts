import type { DbFacade } from 'app/(game)/api/facades/database-facade';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { parseEvent } from 'app/(game)/api/utils/zod/event-schemas';
import { getEventCost } from 'app/(game)/api/handlers/utils/events';
import { updateVillageResourcesAt } from 'app/(game)/api/utils/village';
import { getGameEventResolver } from 'app/(game)/api/utils/event-type-mapper';
import type { EventApiNotificationEvent } from 'app/interfaces/api';
import { deleteEventByIdQuery } from 'app/(game)/api/utils/queries/event-queries';

export const resolveEvent = (database: DbFacade, eventId: GameEvent['id']) => {
  const row = database.selectObject(
    `
      SELECT id, type, starts_at, duration, village_id, resolves_at, meta
      FROM events
      WHERE id = $id;
    `,
    { $id: eventId },
  );

  if (!row) {
    // event disappeared, probably resolved elsewhere — nothing to do
    return;
  }

  const event = parseEvent(row);

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

    // resolver may call createEvents(database, args, db) which in turn will markNeedsRescan()
    resolver(database, event);

    database.exec(deleteEventByIdQuery, {
      $event_id: eventId,
    });

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
