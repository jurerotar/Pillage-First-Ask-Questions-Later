import { BuildingField, ResourceField } from 'interfaces/models/game/village';
import { Building } from 'interfaces/models/game/building';
import { partialArraySum } from 'utils/common';

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

export const calculateResourceProductionFromResourceFields = (resourceFields: ResourceField[], buildingData: Building[]) => {
  const [woodFields, clayFields, ironFields, wheatFields] = [
    resourceFields.filter(({ type }) => type === 'wood'),
    resourceFields.filter(({ type }) => type === 'clay'),
    resourceFields.filter(({ type }) => type === 'iron'),
    resourceFields.filter(({ type }) => type === 'wheat'),
  ];
};
