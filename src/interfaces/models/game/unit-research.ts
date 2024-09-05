import type { Unit } from 'interfaces/models/game/unit';
import type { Village } from 'interfaces/models/game/village';

export type UnitResearch = {
  unitId: Unit['id'];
  researchedIn: Village['id'][];
};
