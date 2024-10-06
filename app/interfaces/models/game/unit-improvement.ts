import type { Unit } from 'app/interfaces/models/game/unit';

export type UnitImprovement = {
  tier: Unit['tier'];
  level: number;
};
