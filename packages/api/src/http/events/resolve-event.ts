import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createEvents } from '../../utils/create-event';
import {
  baseEventRowSchema,
  mapEventRowToTypedEvent,
} from '../../utils/zod/event-schemas';
import {
  areWorkerNotificationsEnabled,
  postWorkerMessage,
} from '../../worker/notification-port';
import { getEventResolver } from './resolver-registry';

export const resolveEvent = (
  database: DbFacade,
  eventId: GameEvent['id'],
  notify:
    | ((event: EventApiNotificationEvent) => void)
    | null = areWorkerNotificationsEnabled() ? postWorkerMessage : null,
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
  });

  if (!eventRow) {
    return;
  }

  const event = mapEventRowToTypedEvent(eventRow);

  try {
    const { affectedVillageIds, affectedTileIds } = getEventResolver(
      event.type,
    ).resolve(database, event, createEvents);

    notify?.({
      eventKey: 'event:success',
      ...event,
      affectedVillageIds,
      affectedTileIds,
    } satisfies EventApiNotificationEvent);
  } catch (error) {
    notify?.({
      eventKey: 'event:error',
      ...event,
      affectedVillageIds: [],
      affectedTileIds: [],
    } satisfies EventApiNotificationEvent);

    throw error;
  }
};
