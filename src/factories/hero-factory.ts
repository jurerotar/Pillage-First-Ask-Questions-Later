import { Hero } from 'interfaces/models/game/hero';
import { Server } from 'interfaces/models/game/server';

type HeroFactoryProps = {
  server: Server;
};

export const heroFactory = ({ server: { id: serverId, playerConfiguration: { tribe } } }: HeroFactoryProps): Hero => {
  // Gaul hero is faster when on horse
  const mountedSpeed = tribe === 'gauls' ? 19 : 14;
  // Teuton hero regenerates health at increased rate
  const baseHealthRegenerationRate = tribe === 'teutons' ? 20 : 10;
  // Roman hero is stronger
  const baseAttackPower = tribe === 'romans' ? 100 : 80;
  // Egyptian hero produces double resources
  const resourceProduction = tribe === 'egyptians' ? 36 : 18;
  // Spartan hero adds speed bonus to infantry-only attacks
  const infantryTroopSpeedBonus = tribe === 'spartans' ? 5 : 0;
  // Hun hero adds speed bonus to cavalry-only attacks
  const mountedTroopSpeedBonus = tribe === 'huns' ? 3 : 0;

  return {
    serverId,
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
      resourceProduction,
      infantryTroopSpeedBonus,
      mountedTroopSpeedBonus,
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
