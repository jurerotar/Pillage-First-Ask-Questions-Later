import { getBuildingDefinition } from '@pillage-first/game-assets/utils/buildings';
import type {
  AmountBuildingRequirement,
  Building,
  BuildingLevelBuildingRequirement,
  BuildingRequirement,
  TribeBuildingRequirement,
} from '@pillage-first/types/models/building';
import type { Tribe } from '@pillage-first/types/models/tribe';

export type AssessedBuildingRequirement = BuildingRequirement & {
  fulfilled: boolean;
};

export type AssessBuildingConstructionReadinessReturn = {
  canBuild: boolean;
  assessedRequirements: AssessedBuildingRequirement[];
};

type BuildingRequirementAssessmentContext = {
  tribe: Tribe;
  maxLevelByBuildingId: ReadonlyMap<Building['id'], number>;
  buildingIdsInQueue: ReadonlySet<Building['id']>;
};

type AssessBuildingRequirementsArgs = BuildingRequirementAssessmentContext & {
  building: Building;
};

export type AssessBuildingConstructionReadinessArgs =
  BuildingRequirementAssessmentContext & {
    buildingId: Building['id'];
  };

const assessBuildingLevelRequirement = (
  requirement: BuildingLevelBuildingRequirement,
  maxLevelByBuildingId: BuildingRequirementAssessmentContext['maxLevelByBuildingId'],
): boolean => {
  const buildingMaxLevel = maxLevelByBuildingId.get(requirement.buildingId);

  if (buildingMaxLevel === undefined) {
    return false;
  }

  return buildingMaxLevel >= requirement.level;
};

const assessBuildingAmountRequirement = (
  building: Building,
  requirement: AmountBuildingRequirement,
  maxLevelByBuildingId: BuildingRequirementAssessmentContext['maxLevelByBuildingId'],
  buildingIdsInQueue: BuildingRequirementAssessmentContext['buildingIdsInQueue'],
): boolean => {
  const sameBuildingMaxLevel = maxLevelByBuildingId.get(building.id);
  const hasExistingInstance = sameBuildingMaxLevel !== undefined;
  const hasPendingInstance = buildingIdsInQueue.has(building.id);
  const hasMaxLevelInstance = sameBuildingMaxLevel === building.maxLevel;
  const canBuildFirstInstance = !hasExistingInstance && !hasPendingInstance;
  const canBuildAdditionalInstance =
    canBuildFirstInstance || hasMaxLevelInstance;

  if (requirement.amount > 1) {
    return canBuildAdditionalInstance;
  }

  return canBuildFirstInstance;
};

const assessTribeRequirement = (
  requirement: TribeBuildingRequirement,
  tribe: Tribe,
): boolean => {
  return requirement.tribe === tribe;
};

const assessRequirement = (
  building: Building,
  requirement: BuildingRequirement,
  tribe: Tribe,
  maxLevelByBuildingId: BuildingRequirementAssessmentContext['maxLevelByBuildingId'],
  buildingIdsInQueue: BuildingRequirementAssessmentContext['buildingIdsInQueue'],
): boolean => {
  switch (requirement.type) {
    case 'building': {
      return assessBuildingLevelRequirement(requirement, maxLevelByBuildingId);
    }
    case 'tribe': {
      return assessTribeRequirement(requirement, tribe);
    }
    case 'amount': {
      return assessBuildingAmountRequirement(
        building,
        requirement,
        maxLevelByBuildingId,
        buildingIdsInQueue,
      );
    }
  }
};

export const assessBuildingRequirements = (
  args: AssessBuildingRequirementsArgs,
): AssessBuildingConstructionReadinessReturn => {
  const { building, tribe, maxLevelByBuildingId, buildingIdsInQueue } = args;
  const { buildingRequirements } = building;

  const assessedRequirements: AssessedBuildingRequirement[] =
    buildingRequirements.map((requirement) => {
      const fulfilled = assessRequirement(
        building,
        requirement,
        tribe,
        maxLevelByBuildingId,
        buildingIdsInQueue,
      );

      return {
        ...requirement,
        fulfilled,
      };
    });

  const canBuild = assessedRequirements.every(({ fulfilled }) => fulfilled);

  return {
    canBuild,
    assessedRequirements,
  };
};

export const assessBuildingConstructionReadiness = (
  args: AssessBuildingConstructionReadinessArgs,
): AssessBuildingConstructionReadinessReturn => {
  return assessBuildingRequirements({
    tribe: args.tribe,
    maxLevelByBuildingId: args.maxLevelByBuildingId,
    buildingIdsInQueue: args.buildingIdsInQueue,
    building: getBuildingDefinition(args.buildingId),
  });
};
