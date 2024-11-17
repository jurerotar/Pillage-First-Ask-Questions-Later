import type { GameEvent, GameEventType } from 'app/interfaces/models/game/game-event';

export const eventFactory = <T extends GameEventType>(args: Omit<GameEvent<T>, 'id'>): GameEvent<T> => {
  const id = crypto.randomUUID();

  return {
    id,
    ...args,
  } as GameEvent<T>;
};
