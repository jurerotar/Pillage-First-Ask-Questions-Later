import type { Unit } from 'app/interfaces/models/game/unit';

export type UnitImprovementModel = {
  unit_id: Unit['id'];
  level: number;
};

export type UnitImprovement = {
  unitId: Unit['id'];
  level: number;
};
