import type {
  UnitImprovement,
  UnitImprovementModel,
} from 'app/interfaces/models/game/unit-improvement';

export const unitImprovementApiResource = (
  unitImprovementModel: UnitImprovementModel,
): UnitImprovement => {
  const { unit_id, level } = unitImprovementModel;

  return {
    unitId: unit_id,
    level,
  };
};
