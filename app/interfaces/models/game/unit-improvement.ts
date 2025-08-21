import type { Unit } from 'app/interfaces/models/game/unit';

export type UnitImprovement = {
  unitId: Unit['id'];
  level: number;
};
