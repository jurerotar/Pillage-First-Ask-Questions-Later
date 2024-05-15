import type { WithServerId } from 'interfaces/models/game/server';
import type { Tribe } from 'interfaces/models/game/tribe';
import type { UnitId } from 'interfaces/models/game/unit';

export type ResearchLevel = WithServerId<{
  unitId: UnitId;
  unitTribe: Tribe;
  level: number;
}>;
