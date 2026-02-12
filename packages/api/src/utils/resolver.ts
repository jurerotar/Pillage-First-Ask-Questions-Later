import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getGameEventResolver } from './event-type-mapper';
import { eventSchema } from './zod/event-schemas';

export const resolveEvent = (
  database: DbFacade,
  eventId: GameEvent['id'],
): void => {
  const event = database.selectObject({
    sql: `
      DELETE FROM events
      WHERE id = $id
      RETURNING id, type, starts_at, duration, village_id, resolves_at, meta;
    `,
    bind: { $id: eventId },
    schema: eventSchema,
  })!;

  try {
    const resolver = getGameEventResolver(event.type);

    // @ts-expect-error - this is fine, we can't properly type all possible GameEvents
    resolver(database, event);

    globalThis.postMessage({
      eventKey: 'event:worker-event-resolve-success',
      ...event,
    } satisfies EventApiNotificationEvent);
  } catch (error) {
    console.error(error);
    globalThis.postMessage({
      eventKey: 'event:worker-event-resolve-error',
      ...event,
    } satisfies EventApiNotificationEvent);
  }
};
