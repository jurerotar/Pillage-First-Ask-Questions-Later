import type { Hero } from 'app/interfaces/models/game/hero';
import type { Server } from 'app/interfaces/models/game/server';

export const heroFactory = (_server: Server): Hero => {
  return {
    stats: {
      experience: 0,
      health: 100,
    },
    selectableAttributes: {
      attackPower: 0,
      attackBonus: 0,
      defenceBonus: 0,
      resourceProduction: 4,
    },
    resourceToProduce: 'shared',
    unitType: 'infantry',
    inventory: [],
    adventureCount: 0,
    equippedItems: {
      head: null,
      torso: null,
      legs: null,
      'right-hand': null,
      'left-hand': null,
      horse: null,
      consumable: null,
    },
  };
};
