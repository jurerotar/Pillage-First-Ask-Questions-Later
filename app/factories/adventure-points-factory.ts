import type { AdventurePoints } from 'app/interfaces/models/game/adventure-points';

export const adventurePointsFactory = (): AdventurePoints => {
  return {
    amount: 3,
  };
};
