import { ResearchLevel } from 'interfaces/models/game/research-level';
import _unitsData from 'assets/units.json' assert { type: 'json' };
import { Unit } from 'interfaces/models/game/unit';
import { Server } from 'interfaces/models/game/server';

const unitData = _unitsData as Unit[];

type ResearchLevelsFactoryProps = {
  server: Server;
};

export const researchLevelsFactory = ({ server: { id: serverId } }: ResearchLevelsFactoryProps): ResearchLevel[] => {
  return unitData.map(({ tribe, id }: Unit) => ({
    serverId,
    unitTribe: tribe,
    unitId: id,
    level: 0
  }));
};
