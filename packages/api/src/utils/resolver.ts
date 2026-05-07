import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getGameEventResolver } from './event-type-mapper';
import {
  baseEventRowSchema,
  mapEventRowToTypedEvent,
} from './zod/event-schemas';

export const resolveEvent = (
  database: DbFacade,
  eventId: GameEvent['id'],
): void => {
  const eventRow = database.selectObject({
    sql: `
      DELETE
      FROM
        events
      WHERE
        id = $id
      RETURNING id, type, starts_at, duration, village_id, resolves_at, meta;
    `,
    bind: { $id: eventId },
    schema: baseEventRowSchema,
  })!;
  const event = mapEventRowToTypedEvent(eventRow);

  try {
    const resolver = getGameEventResolver(event.type);
    (resolver as (db: DbFacade, ev: GameEvent) => void)(database, event);

    globalThis.postMessage({
      eventKey: 'event:success',
      ...event,
    } satisfies EventApiNotificationEvent);
  } catch (error) {
    console.error(error);
    globalThis.postMessage({
      eventKey: 'event:error',
      ...event,
    } satisfies EventApiNotificationEvent);
  }
};
