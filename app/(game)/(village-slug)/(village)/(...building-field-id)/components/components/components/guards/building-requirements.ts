import type { BuildingRequirement, CapitalBuildingRequirement } from 'app/interfaces/models/game/building';

export const isCapitalBuildingRequirement = (
  buildingRequirement: BuildingRequirement,
): buildingRequirement is CapitalBuildingRequirement => {
  return buildingRequirement.type === 'capital';
};
