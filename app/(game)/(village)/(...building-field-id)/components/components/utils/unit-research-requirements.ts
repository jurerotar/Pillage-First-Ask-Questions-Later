import { unitsMap } from 'app/assets/units';
import type { Unit, UnitResearchRequirement } from 'app/interfaces/models/game/unit';
import type { Village } from 'app/interfaces/models/game/village';

export type AssessedResearchRequirement = UnitResearchRequirement & {
  fulfilled: boolean;
};

type AssessUnitResearchReadinessReturn = {
  unitId: Unit['id'];
  canResearch: boolean;
  assessedRequirements: AssessedResearchRequirement[];
};

const assessBuildingLevelRequirement = (requirement: UnitResearchRequirement, village: Village): boolean => {
  const { buildingFields } = village;
  return (buildingFields.find(({ buildingId: id }) => requirement.buildingId === id)?.level ?? 0) >= requirement.level;
};

export const assessUnitResearchReadiness = (unitId: Unit['id'], village: Village): AssessUnitResearchReadinessReturn => {
  const { researchRequirements } = unitsMap.get(unitId)!;

  const assessedRequirements: AssessedResearchRequirement[] = researchRequirements.map((requirement) => {
    const fulfilled = assessBuildingLevelRequirement(requirement, village);

    return {
      ...requirement,
      fulfilled,
    };
  });

  const canResearch = assessedRequirements.length > 0 ? assessedRequirements.every(({ fulfilled }) => fulfilled) : true;

  return {
    unitId,
    canResearch,
    assessedRequirements,
  };
};
