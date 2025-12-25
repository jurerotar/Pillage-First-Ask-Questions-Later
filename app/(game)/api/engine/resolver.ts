import type { DbFacade } from 'app/(game)/api/facades/database-facade';
import { getGameEventResolver } from 'app/(game)/api/utils/event-type-mapper';
import { parseEvent } from 'app/(game)/api/utils/zod/event-schemas';
import type { EventApiNotificationEvent } from 'app/interfaces/api';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

export const resolveEvent = (database: DbFacade, eventId: GameEvent['id']) => {
  const deletedRow = database.selectObject(
    `
      DELETE FROM events
      WHERE id = $id
      RETURNING id, type, starts_at, duration, village_id, resolves_at, meta;
    `,
    { $id: eventId },
  );

  const event = parseEvent(deletedRow);

  try {
    const resolver = getGameEventResolver(event.type);

    // @ts-expect-error - this is fine, we can't properly type all possible GameEvents
    resolver(database, event);

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
