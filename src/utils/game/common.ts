import { BuildingField, ResourceField } from 'interfaces/models/game/village';
import { Building } from 'interfaces/models/game/building';
import { partialArraySum } from 'utils/common';
import { resourceBuildingIdToEffectIdMap, resourceTypeToResourceBuildingIdMap } from 'utils/game/maps';

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

export const getResourceProductionByResourceField = (resourceField: ResourceField, buildingData: Building[]): number => {
  const { type, level } = resourceField;
  const buildingId = resourceTypeToResourceBuildingIdMap.get(type)!;
  const resourceProductionEffectId = resourceBuildingIdToEffectIdMap.get(buildingId);
  const fullBuildingData: Building = buildingData.find(({ id }) => id === buildingId)!;
  const resourceProduction = fullBuildingData.effects.find(({ effectId }) => effectId === resourceProductionEffectId)!.valuesPerLevel;
  return resourceProduction[level];
};

export const calculateResourceProductionFromResourceFields = (resourceFields: ResourceField[], buildingData: Building[]) => {
  const [woodProduction, clayProduction, ironProduction, wheatProduction] = [
    resourceFields.filter(({ type }) => type === 'wood'),
    resourceFields.filter(({ type }) => type === 'clay'),
    resourceFields.filter(({ type }) => type === 'iron'),
    resourceFields.filter(({ type }) => type === 'wheat'),
  ].map((resourceFieldsByResourceType: ResourceField[]) => {
    return resourceFieldsByResourceType.reduce((acc, current) => acc + getResourceProductionByResourceField(current, buildingData), 0);
  });

  return {
    woodProduction,
    clayProduction,
    ironProduction,
    wheatProduction
  };
};
