import type { Hero } from 'app/interfaces/models/game/hero';
import type { Server } from 'app/interfaces/models/game/server';

export const heroFactory = (server: Server): Hero => {
  const { tribe } = server.playerConfiguration;

  return {
    stats: {
      experience: 0,
      health: 100,
    },
    selectableAttributes: {
      attackPower: 0,
      attackBonus: 0,
      defenceBonus: 0,
      resourceProduction: 0,
    },
    resourceToProduce: 'shared',
    unitType: 'infantry',
    inventory: [],
    adventureCount: 0,
    tribe,
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
