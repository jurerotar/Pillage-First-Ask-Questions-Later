import { BuildingField } from 'interfaces/models/game/village';
import { Building } from 'interfaces/models/game/building';
import { partialArraySum } from 'utils/common';
import { resourceBuildingIdToEffectIdMap, resourceBuildingIdToResourceTypeMap } from 'utils/game/maps';

export const calculatePopulationFromBuildingFields = (buildingFields: BuildingField[], buildingData: Building[]): number => {
  let sum: number = 0;

  buildingFields.forEach(({ buildingId, level }) => {
    if (buildingId === null) {
      return;
    }

    const fullBuildingData: Building = buildingData.find(({ id }) => id === buildingId)!;
    sum += partialArraySum(fullBuildingData.cropConsumption, level);
  });

  return sum;
};

export const calculateCulturePointsProductionFromBuildingFields = (buildingFields: BuildingField[], buildingData: Building[]): number => {
  let sum: number = 0;

  buildingFields.forEach(({ buildingId, level }) => {
    if (buildingId === null) {
      return;
    }

    const fullBuildingData: Building = buildingData.find(({ id }) => id === buildingId)!;
    sum += partialArraySum(fullBuildingData.culturePointsProduction, level);
  });

  return sum;
};

export const getResourceProductionByResourceField = (resourceField: BuildingField, buildingData: Building[]): number => {
  const { buildingId, level } = resourceField;
  const resourceProductionEffectId = resourceBuildingIdToEffectIdMap.get(buildingId);
  const fullBuildingData: Building = buildingData.find(({ id }) => id === buildingId)!;
  const resourceProduction = fullBuildingData.effects.find(({ effectId }) => effectId === resourceProductionEffectId)!.valuesPerLevel;
  return resourceProduction[level];
};

export const calculateResourceProductionFromResourceFields = (resourceFields: BuildingField[], buildingData: Building[]) => {
  const [woodProduction, clayProduction, ironProduction, wheatProduction] = [
    resourceFields.filter(({ buildingId }) => resourceBuildingIdToResourceTypeMap.get(buildingId) === 'wood'),
    resourceFields.filter(({ buildingId }) => resourceBuildingIdToResourceTypeMap.get(buildingId) === 'clay'),
    resourceFields.filter(({ buildingId }) => resourceBuildingIdToResourceTypeMap.get(buildingId) === 'iron'),
    resourceFields.filter(({ buildingId }) => resourceBuildingIdToResourceTypeMap.get(buildingId) === 'wheat'),
  ].map((resourceFieldsByResourceType: BuildingField[]) => {
    return resourceFieldsByResourceType.reduce((acc, current) => acc + getResourceProductionByResourceField(current, buildingData), 0);
  });

  return {
    woodProduction,
    clayProduction,
    ironProduction,
    wheatProduction,
  };
};
