import { units } from 'assets/units';
import type { ResearchLevel } from 'interfaces/models/game/research-level';
import type { Server } from 'interfaces/models/game/server';
import type { Unit } from 'interfaces/models/game/unit';

type ResearchLevelsFactoryProps = {
  server: Server;
};

export const researchLevelsFactory = ({ server: { id: serverId } }: ResearchLevelsFactoryProps): ResearchLevel[] => {
  return units.map(({ tribe, id }: Unit) => ({
    serverId,
    unitTribe: tribe,
    unitId: id,
    level: 0,
  }));
};
