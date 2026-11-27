import type {
  GameEvent,
  GameEventType,
} from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getEventResolver } from '../../http/events/resolver-registry';

export const getCreationRules = (
  database: DbFacade,
  event: GameEvent<GameEventType>,
) => getEventResolver(event.type).create(database, event);

export const insertTestEvents = (
  database: DbFacade,
  events: GameEvent<GameEventType>[],
  now = Date.now(),
) => {
  for (const event of events) {
    getCreationRules(database, event).insert(
      event.startsAt,
      event.duration,
      now,
    );
  }
};
