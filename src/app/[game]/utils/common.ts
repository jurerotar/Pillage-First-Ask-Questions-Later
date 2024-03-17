import { BuildingField, Village } from 'interfaces/models/game/village';
import { Building } from 'interfaces/models/game/building';
import { partialArraySum } from 'app/utils/common';
import { resourceBuildingIdToEffectIdMap, resourceBuildingIdToResourceTypeMap } from 'app/[game]/utils/maps';
import { buildings } from 'assets/buildings';

export const getBuildingData = (buildingId: Building['id']) => {
  const building: Building = buildings.find(({ id }) => id === buildingId)!;
  return building;
}

export const getBuildingDataForLevel = (buildingId: Building['id'], level: number) => {
  const building = getBuildingData(buildingId);
  const isMaxLevel = building.cropConsumption.length === level;
  const cumulativeCropConsumption = partialArraySum(building.cropConsumption, level);
  const cumulativeCulturePointsProduction = partialArraySum(building.culturePointsProduction, level);
  const nextLevelCropConsumption = building.cropConsumption[level + 1] ?? 0;
  const nextLevelCulturePointsProduction = building.cropConsumption[level + 1] ?? 0;
  const nextLevelResourceCost = building.buildingCost[level + 1] ?? [0, 0, 0, 0];
  const nextLevelBuildingDuration = building.buildingDuration[level + 1] ?? 0;

  return {
    building,
    isMaxLevel,
    cumulativeCropConsumption,
    cumulativeCulturePointsProduction,
    nextLevelCropConsumption,
    nextLevelCulturePointsProduction,
    nextLevelResourceCost,
    nextLevelBuildingDuration
  };
};

export const getBuildingFieldByBuildingFieldId = (currentVillage: Village, buildingFieldId: BuildingField['id']): BuildingField | null => {
  return currentVillage.buildingFields.find(({ id: fieldId }) => buildingFieldId === fieldId) ?? null;
}

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
