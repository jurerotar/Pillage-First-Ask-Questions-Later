import {
  AmountBuildingRequirement,
  BuildingId,
  BuildingLevelBuildingRequirement,
  BuildingRequirement,
  CapitalBuildingRequirement,
  TribeBuildingRequirement,
} from 'interfaces/models/game/building';
import { getBuildingData } from 'app/[game]/utils/common';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { useEvents } from 'app/[game]/hooks/use-events';
import { BuildingField } from 'interfaces/models/game/village';
import { useTribe } from 'app/[game]/hooks/use-tribe';

const isBuildingRequirement = (requirement: BuildingRequirement): requirement is BuildingLevelBuildingRequirement => {
  return requirement.type === 'building';
}

const isTribeRequirement = (requirement: BuildingRequirement): requirement is TribeBuildingRequirement => {
  return requirement.type === 'tribe';
}

const isAmountRequirement = (requirement: BuildingRequirement): requirement is AmountBuildingRequirement => {
  return requirement.type === 'tribe';
}

const isCapitalRequirement = (requirement: BuildingRequirement): requirement is CapitalBuildingRequirement => {
  return requirement.type === 'capital';
}

export const useBuildingRequirements = (buildingId: BuildingId) => {
  const { tribe } = useTribe();
  const { currentVillageBuildingEvents } = useEvents();
  const { currentVillage: { buildingFields, isCapital } } = useCurrentVillage();
  const building = getBuildingData(buildingId);
  const requirements = building.buildingRequirements;

  console.log(isCapital);

  // Check amount requirement
  const amountRequirement = requirements.find(isAmountRequirement);
  const hasAmountRequirement = !!amountRequirement;
  const hasMetAmountRequirement = (() => {
    // You may have multiple same buildings in some cases
    const sameBuildingFields: BuildingField[] = buildingFields.filter(({ buildingId: id }) => id === buildingId);
    console.log(sameBuildingFields, currentVillageBuildingEvents);

    // If building does not have an amount restriction, we only check if we currently have a max level building of same id
    if (!hasAmountRequirement) {
      return sameBuildingFields.some(({ level }) => level === building.buildingCost.length);
    }


    // If we have an amount restriction, we need to check whether building already stands or is currently being constructed
    return !(
      sameBuildingFields.length > 0 ||
      currentVillageBuildingEvents.find(({ buildingId: buildingIdUnderConstruction }) => buildingIdUnderConstruction === buildingId)
    );
  })();

  // Tribe requirement
  const tribeRequirements = requirements.find(isTribeRequirement);
  const hasTribeRequirement = !!tribeRequirements;
  const hasMetTribeRequirement = hasTribeRequirement ? tribe === tribeRequirements!.tribe : true;

  // Other buildings requirement
  const otherBuildingRequirements = requirements.filter(isBuildingRequirement);
  const hasOtherBuildingRequirements = otherBuildingRequirements.length > 0;
  const hasMetOtherBuildingRequirements = otherBuildingRequirements.every(({ buildingId: requirementBuildingId, level }) => {
    return (buildingFields.find(({ buildingId: id }) => requirementBuildingId === id)?.level ?? 0) >= level;
  });

  // Capital requirement
  const capitalRequirement = requirements.find(isCapitalRequirement);
  const hasCapitalRequirement = !!capitalRequirement;
  const hasMetCapitalRequirement = hasCapitalRequirement ? (capitalRequirement.canBuildOnlyInCapital === isCapital) : true;

  const meetsRequirements = (() => {
    let result = true;

    result = result && (!hasAmountRequirement || hasMetAmountRequirement);
    result = result && (!hasTribeRequirement || hasMetTribeRequirement);
    result = result && (!hasOtherBuildingRequirements || hasMetOtherBuildingRequirements);
    result = result && (!hasCapitalRequirement || hasMetCapitalRequirement);

    return result;
  })();

  return {
    meetsRequirements,
    hasMetTribeRequirement,
    hasMetOtherBuildingRequirements,
    hasMetCapitalRequirement,
    hasMetAmountRequirement,
  }
};
