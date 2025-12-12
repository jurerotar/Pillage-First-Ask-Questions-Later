import { getBuildingDefinition } from 'app/assets/utils/buildings';
import type {
  AmountBuildingRequirement,
  Building,
  BuildingLevelBuildingRequirement,
  BuildingRequirement,
  TribeBuildingRequirement,
} from 'app/interfaces/models/game/building';
import type { Tribe } from 'app/interfaces/models/game/tribe';
import type { BuildingContextReturn } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-provider';

export type AssessedBuildingRequirement = BuildingRequirement & {
  fulfilled: boolean;
};

export type AssessBuildingConstructionReadinessReturn = {
  canBuild: boolean;
  assessedRequirements: AssessedBuildingRequirement[];
};

export type AssessBuildingConstructionReadinessArgs = {
  tribe: Tribe;
  buildingId: Building['id'];
  maxLevelByBuildingId: BuildingContextReturn['maxLevelByBuildingId'];
  buildingIdsInQueue: BuildingContextReturn['buildingIdsInQueue'];
};

type AssessFunctionArgs<T extends BuildingRequirement> =
  AssessBuildingConstructionReadinessArgs & {
    requirement: T;
    building: Building;
  };

const assessBuildingLevelRequirement = (
  args: AssessFunctionArgs<BuildingLevelBuildingRequirement>,
): boolean => {
  const { requirement, maxLevelByBuildingId } = args;

  const buildingMaxLevel = maxLevelByBuildingId.get(requirement.buildingId);

  if (!buildingMaxLevel) {
    return false;
  }

  return buildingMaxLevel >= requirement.level;
};

const assessBuildingAmountRequirement = (
  args: AssessFunctionArgs<AmountBuildingRequirement>,
): boolean => {
  const {
    building,
    requirement,
    buildingIdsInQueue,
    maxLevelByBuildingId,
    buildingId,
  } = args;

  const sameBuildingMaxLevel = maxLevelByBuildingId.get(buildingId);
  const buildingExistsInQueue = buildingIdsInQueue.has(buildingId);

  // If a building is not unique, we only check if we currently have a max level building of same id or if the building does not yet exist or isn't being constructed
  if (requirement.amount > 1) {
    return !sameBuildingMaxLevel && !buildingExistsInQueue
      ? true
      : sameBuildingMaxLevel === building.maxLevel;
  }

  // If we have an amount restriction, we need to check whether building already stands or is currently being constructed
  return !(sameBuildingMaxLevel || buildingExistsInQueue);
};

const assessTribeRequirement = (
  args: AssessFunctionArgs<TribeBuildingRequirement>,
): boolean => {
  const { requirement, tribe } = args;
  return requirement.tribe === tribe;
};

export const assessBuildingConstructionReadiness = (
  args: AssessBuildingConstructionReadinessArgs,
): AssessBuildingConstructionReadinessReturn => {
  const { buildingId } = args;

  const building = getBuildingDefinition(buildingId);
  const { buildingRequirements } = building;

  const assessedRequirements: AssessedBuildingRequirement[] =
    buildingRequirements.map((requirement) => {
      let fulfilled = false;

      switch (requirement.type) {
        case 'building': {
          fulfilled = assessBuildingLevelRequirement({
            ...args,
            requirement,
            building,
          });
          break;
        }
        case 'tribe': {
          fulfilled = assessTribeRequirement({
            ...args,
            requirement,
            building,
          });
          break;
        }
        case 'amount': {
          fulfilled = assessBuildingAmountRequirement({
            ...args,
            requirement,
            building,
          });
          break;
        }
      }

      return {
        ...requirement,
        fulfilled,
      };
    });

  const canBuild =
    assessedRequirements.length > 0
      ? assessedRequirements.every(({ fulfilled }) => fulfilled)
      : true;

  return {
    canBuild,
    assessedRequirements,
  };
};
