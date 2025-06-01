import type { Unit } from 'app/interfaces/models/game/unit';
import type { Village } from 'app/interfaces/models/game/village';

export type UnitResearch = {
  unitId: Unit['id'];
  villageId: Village['id'];
  isResearched: boolean;
};
