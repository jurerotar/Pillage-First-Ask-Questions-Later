import { Hero } from 'interfaces/models/game/hero';
import { Server } from 'interfaces/models/game/server';

type HeroFactoryProps = Pick<Server, 'id'> & Pick<Server['playerConfiguration'], 'tribe'>;

export const heroFactory = ({ id, tribe }: HeroFactoryProps): Hero => {
  return {
    serverId: id,
    level: 0,
    experience: 0,
    health: 100,
    healthRegenerationRate: 10,
    attributes: {

    },
    speed,
    attackPower,
    resourceProduction: 4,
    resourceToProduce: 'shared',
    attackBonus: 0,
    defenceBonus: 0,
    unitType: 'infantry',
    inventory: []
  };
};
