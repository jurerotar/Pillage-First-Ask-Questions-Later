import type { GameEvent, GameEventType } from 'app/interfaces/models/game/game-event';
import type { Server } from 'app/interfaces/models/game/server';
import { calculateAdventurePointIncreaseEventDuration } from 'app/factories/utils/event';
import { adventurePointsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const eventFactory = <T extends GameEventType>(args: Omit<GameEvent<T>, 'id'>): GameEvent<T> => {
  const id = crypto.randomUUID();

  return {
    id,
    ...args,
  } as GameEvent<T>;
};

export const generateEvents = (server: Server): GameEvent[] => {
  const adventurePointIncreaseEvent = eventFactory<'adventurePointIncrease'>({
    type: 'adventurePointIncrease',
    startsAt: server.createdAt,
    duration: calculateAdventurePointIncreaseEventDuration(server),
    cachesToClear: [adventurePointsCacheKey],
  });

  return [adventurePointIncreaseEvent];
};
