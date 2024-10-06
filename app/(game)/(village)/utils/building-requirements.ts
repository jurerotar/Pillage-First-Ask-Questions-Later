import { getBuildingData } from 'app/(game)/utils/building';
import type { GameEvent, GameEventType } from 'app/interfaces/models/events/game-event';
import type {
  AmountBuildingRequirement,
  Building,
  BuildingLevelBuildingRequirement,
  BuildingRequirement,
  CapitalBuildingRequirement,
  TribeBuildingRequirement,
} from 'app/interfaces/models/game/building';
import type { Tribe } from 'app/interfaces/models/game/tribe';
import type { BuildingField, Village } from 'app/interfaces/models/game/village';

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
  currentVillageBuildingEvents: GameEvent<GameEventType.BUILDING_CONSTRUCTION>[];
  buildingId: Building['id'];
};

type AssessFunctionArgs<T extends BuildingRequirement> = AssessBuildingConstructionReadinessArgs & {
  requirement: T;
  building: Building;
};

const assessBuildingLevelRequirement = (args: AssessFunctionArgs<BuildingLevelBuildingRequirement>): boolean => {
  const {
    requirement,
    currentVillage: { buildingFields },
  } = args;
  return (buildingFields.find(({ buildingId: id }) => requirement.buildingId === id)?.level ?? 0) >= requirement.level;
};

const assessBuildingAmountRequirement = (args: AssessFunctionArgs<AmountBuildingRequirement>): boolean => {
  const {
    building,
    requirement,
    currentVillage: { buildingFields },
    currentVillageBuildingEvents,
    buildingId,
  } = args;
  const sameBuildingFields: BuildingField[] = buildingFields.filter(({ buildingId: id }) => id === buildingId);
  const buildingExistsInQueue = !!currentVillageBuildingEvents.find(
    ({ building: { id: buildingIdUnderConstruction } }) => buildingIdUnderConstruction === buildingId,
  );

  // If a building is not unique, we only check if we currently have a max level building of same id or if the building does not yet exist or isn't being constructed
  if (requirement.amount > 1) {
    return sameBuildingFields.length === 0 && !buildingExistsInQueue
      ? true
      : sameBuildingFields.some(({ level }) => level === building.buildingCost.length);
  }

  // If we have an amount restriction, we need to check whether building already stands or is currently being constructed
  return !(sameBuildingFields.length > 0 || buildingExistsInQueue);
};

const assessCapitalRequirement = (args: AssessFunctionArgs<CapitalBuildingRequirement>): boolean => {
  const {
    requirement,
    currentVillage: { isCapital },
  } = args;
  return requirement.canBuildOnlyInCapital === isCapital;
};

const assessTribeRequirement = (args: AssessFunctionArgs<TribeBuildingRequirement>): boolean => {
  const { requirement, tribe } = args;
  return requirement.tribe === tribe;
};

export const assessBuildingConstructionReadiness = (
  args: AssessBuildingConstructionReadinessArgs,
): AssessBuildingConstructionReadinessReturn => {
  const { buildingId } = args;

  const building = getBuildingData(buildingId);
  const requirements = building.buildingRequirements;

  const assessedRequirements: AssessedBuildingRequirement[] = requirements.map((requirement) => {
    let fulfilled: boolean;

    switch (requirement.type) {
      case 'building': {
        fulfilled = assessBuildingLevelRequirement({ ...args, requirement, building });
        break;
      }
      case 'tribe': {
        fulfilled = assessTribeRequirement({ ...args, requirement, building });
        break;
      }
      case 'capital': {
        fulfilled = assessCapitalRequirement({ ...args, requirement, building });
        break;
      }
      case 'amount': {
        fulfilled = assessBuildingAmountRequirement({ ...args, requirement, building });
        break;
      }
      default:
        fulfilled = false;
    }

    return {
      ...requirement,
      fulfilled,
    };
  });

  const canBuild = assessedRequirements.length > 0 ? assessedRequirements.every(({ fulfilled }) => fulfilled) : true;

  return {
    canBuild,
    assessedRequirements,
  };
};
