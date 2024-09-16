import type { Unit } from 'interfaces/models/game/unit';

export type UnitImprovement = {
  tier: Unit['tier'];
  level: number;
};
