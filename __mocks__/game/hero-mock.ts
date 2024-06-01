import type { Hero } from 'interfaces/models/game/hero';

export const heroMock: Hero = {
  stats: {
    level: 0,
    experience: 0,
    health: 100,
  },
  staticAttributes: {
    unmountedSpeed: 7,
    mountedSpeed: 19,
    baseAttackPower: 80,
    baseHealthRegenerationRate: 10,
    resourceProduction: 18,
    infantryTroopSpeedBonus: 0,
    mountedTroopSpeedBonus: 0,
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
};
