import { ResearchLevel } from 'interfaces/models/game/research-level';
import { Unit } from 'interfaces/models/game/unit';
import { Server } from 'interfaces/models/game/server';
import { units } from 'assets/units';


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
