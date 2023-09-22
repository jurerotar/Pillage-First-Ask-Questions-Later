import { UnitId } from 'interfaces/models/game/unit';
import { Tribe } from 'interfaces/models/game/tribe';
import { WithServerId } from 'interfaces/models/game/server';

export type ResearchLevel = WithServerId<{
  unitId: UnitId;
  unitTribe: Tribe;
  level: number;
}>;
