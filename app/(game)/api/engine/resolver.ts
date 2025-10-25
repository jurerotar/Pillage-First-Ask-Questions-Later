import type { DbFacade } from 'app/(game)/api/facades/database-facade';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { parseEvent } from 'app/(game)/api/utils/zod/event-schemas';
import { getEventCost } from 'app/(game)/api/handlers/utils/events';
import { updateVillageResourcesAt } from 'app/(game)/api/utils/village';
import { getGameEventResolver } from 'app/(game)/api/utils/event-type-mapper';
import type { EventApiNotificationEvent } from 'app/interfaces/api';

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

    resolver(database, event satisfies GameEvent);

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
