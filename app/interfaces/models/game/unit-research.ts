import type { Unit } from 'app/interfaces/models/game/unit';
import type { Village } from 'app/interfaces/models/game/village';

export type UnitResearchModel = {
  unit_id: Unit['id'];
  village_id: Village['id'];
};

export type UnitResearch = {
  unitId: Unit['id'];
  villageId: Village['id'];
};
