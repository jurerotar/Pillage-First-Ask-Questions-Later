import type { Hero } from 'app/interfaces/models/game/hero';
import type { Server } from 'app/interfaces/models/game/server';

export const heroFactory = (server: Server): Hero => {
  const { tribe } = server.playerConfiguration;

  // Gaul hero is faster when on horse
  const mountedSpeed = tribe === 'gauls' ? 19 : 14;
  // Teuton hero regenerates health at increased rate
  const baseHealthRegenerationRate = tribe === 'teutons' ? 20 : 10;
  // Roman hero is stronger
  const baseAttackPower = tribe === 'romans' ? 100 : 80;

  return {
    stats: {
      level: 0,
      experience: 0,
      health: 100,
    },
    staticAttributes: {
      unmountedSpeed: 7,
      mountedSpeed,
      baseAttackPower,
      baseHealthRegenerationRate,
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
};
