import { BuildingField, Village } from 'interfaces/models/game/village';
import { Building } from 'interfaces/models/game/building';
import { partialArraySum } from 'app/utils/common';
import { buildings } from 'assets/buildings';

export const getBuildingData = (buildingId: Building['id']) => {
  const building: Building = buildings.find(({ id }) => id === buildingId)!;
  return building;
};

export const getBuildingDataForLevel = (buildingId: Building['id'], level: number) => {
  const building = getBuildingData(buildingId);
  const isMaxLevel = building.cropConsumption.length === level;
  const cumulativeCropConsumption = partialArraySum(building.cropConsumption, level);
  const nextLevelCropConsumption = building.cropConsumption[level + 1] ?? 0;
  const nextLevelResourceCost = building.buildingCost[level + 1] ?? [0, 0, 0, 0];
  const nextLevelBuildingDuration = building.buildingDuration[level + 1] ?? 0;

  return {
    building,
    isMaxLevel,
    cumulativeCropConsumption,
    nextLevelCropConsumption,
    nextLevelResourceCost,
    nextLevelBuildingDuration,
  };
};

export const getBuildingFieldByBuildingFieldId = (currentVillage: Village, buildingFieldId: BuildingField['id']): BuildingField | null => {
  return currentVillage.buildingFields.find(({ id: fieldId }) => buildingFieldId === fieldId) ?? null;
};

export const calculatePopulationFromBuildingFields = (buildingFields: BuildingField[]): number => {
  let sum: number = 0;

  buildingFields.forEach(({ buildingId, level }) => {
    if (buildingId === null) {
      return;
    }

    const fullBuildingData: Building = buildings.find(({ id }) => id === buildingId)!;
    sum += partialArraySum(fullBuildingData.cropConsumption, level);
  });

  return sum;
};

export const getResourceProductionByResourceField = (resourceField: BuildingField): number => {
  const { buildingId, level } = resourceField;
  const fullBuildingData: Building = buildings.find(({ id }) => id === buildingId)!;
  // There's only 1 effect on production buildings, this should be fine
  const resourceProduction = fullBuildingData.effects[0]!.valuesPerLevel;
  return resourceProduction[level];
};

export const calculateResourceProductionFromResourceFields = (resourceFields: BuildingField[]) => {
  const [woodProduction, clayProduction, ironProduction, wheatProduction] = [
    resourceFields.filter(({ buildingId }) => buildingId === 'WOODCUTTER'),
    resourceFields.filter(({ buildingId }) => buildingId === 'CLAY_PIT'),
    resourceFields.filter(({ buildingId }) => buildingId === 'IRON_MINE'),
    resourceFields.filter(({ buildingId }) => buildingId === 'CROPLAND'),
  ].map((resourceFieldsByResourceType: BuildingField[]) => {
    return resourceFieldsByResourceType.reduce((acc, current) => acc + getResourceProductionByResourceField(current), 0);
  });

  return {
    woodProduction,
    clayProduction,
    ironProduction,
    wheatProduction,
  };
};
