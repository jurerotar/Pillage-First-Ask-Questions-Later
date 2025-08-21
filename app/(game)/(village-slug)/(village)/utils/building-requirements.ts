import { getBuildingData } from 'app/(game)/(village-slug)/utils/building';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type {
  AmountBuildingRequirement,
  ArtifactBuildingRequirement,
  Building,
  BuildingLevelBuildingRequirement,
  BuildingRequirement,
  TribeBuildingRequirement,
} from 'app/interfaces/models/game/building';
import type { Tribe } from 'app/interfaces/models/game/tribe';
import type {
  BuildingField,
  Village,
} from 'app/interfaces/models/game/village';

export type AssessedBuildingRequirement = BuildingRequirement & {
  fulfilled: boolean;
};

export type AssessBuildingConstructionReadinessReturn = {
  canBuild: boolean;
  assessedRequirements: AssessedBuildingRequirement[];
};

export type AssessBuildingConstructionReadinessArgs = {
  tribe: Tribe;
  playerVillages: Village[];
  currentVillage: Village;
  currentVillageBuildingEvents: GameEvent<'buildingConstruction'>[];
  buildingId: Building['id'];
  isGreatBuildingsArtifactActive: boolean;
};

type AssessFunctionArgs<T extends BuildingRequirement> =
  AssessBuildingConstructionReadinessArgs & {
    requirement: T;
    building: Building;
  };

const assessBuildingLevelRequirement = (
  args: AssessFunctionArgs<BuildingLevelBuildingRequirement>,
): boolean => {
  const {
    requirement,
    currentVillage: { buildingFields },
  } = args;

  for (const { buildingId, level } of buildingFields) {
    if (buildingId === requirement.buildingId && level >= requirement.level) {
      return true;
    }
  }

  return false;
};

const assessBuildingAmountRequirement = (
  args: AssessFunctionArgs<AmountBuildingRequirement>,
): boolean => {
  const {
    building,
    requirement,
    currentVillage: { buildingFields },
    currentVillageBuildingEvents,
    buildingId,
  } = args;

  const sameBuildingFields: BuildingField[] = buildingFields.filter(
    ({ buildingId: id }) => id === buildingId,
  );
  const buildingExistsInQueue = !!currentVillageBuildingEvents.find(
    ({ buildingId: buildingUnderConstructionId }) =>
      buildingUnderConstructionId === buildingId,
  );

  // If a building is not unique, we only check if we currently have a max level building of same id or if the building does not yet exist or isn't being constructed
  if (requirement.amount > 1) {
    return sameBuildingFields.length === 0 && !buildingExistsInQueue
      ? true
      : sameBuildingFields.some(({ level }) => level === building.maxLevel);
  }

  // If we have an amount restriction, we need to check whether building already stands or is currently being constructed
  return !(sameBuildingFields.length > 0 || buildingExistsInQueue);
};

const assessTribeRequirement = (
  args: AssessFunctionArgs<TribeBuildingRequirement>,
): boolean => {
  const { requirement, tribe } = args;
  return requirement.tribe === tribe;
};

const assessArtifactRequirement = (
  args: AssessFunctionArgs<ArtifactBuildingRequirement>,
): boolean => {
  const { isGreatBuildingsArtifactActive } = args;
  return isGreatBuildingsArtifactActive;
};

export const assessBuildingConstructionReadiness = (
  args: AssessBuildingConstructionReadinessArgs,
): AssessBuildingConstructionReadinessReturn => {
  const { buildingId } = args;

  const building = getBuildingData(buildingId);
  const requirements = building.buildingRequirements;

  const assessedRequirements: AssessedBuildingRequirement[] = requirements.map(
    (requirement) => {
      let fulfilled: boolean;

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
        case 'artifact': {
          fulfilled = assessArtifactRequirement({
            ...args,
            requirement,
            building,
          });
          break;
        }
        default:
          fulfilled = false;
      }

      return {
        ...requirement,
        fulfilled,
      };
    },
  );

  const canBuild =
    assessedRequirements.length > 0
      ? assessedRequirements.every(({ fulfilled }) => fulfilled)
      : true;

  return {
    canBuild,
    assessedRequirements,
  };
};
