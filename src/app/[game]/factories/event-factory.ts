import { GameEvent } from 'interfaces/models/events/game-event';

export const eventFactory = (args: Omit<GameEvent, 'id'>): GameEvent => {
  const id = crypto.randomUUID();

  return {
    id,
    ...args,
  };
};
