import { Building } from 'interfaces/models/game/building';
import { roundToNearestN } from 'helpers/common';

// All building costs follow the formula baseCostByResource * e ** (0.513 * buildingLevelToBuild) rounded to nearest 5
export const calculateBuildCost = (level: number, baseCost: Building['buildingCostModifier']): number[] => {
  return baseCost.map((baseCostByResource: number) => {
    return roundToNearestN(baseCostByResource * Math.E ** (0.513 * level), 5);
  });
};

// Demolishing a level of a building returns 50% of the resources spent to upgrade to that level
export const calculateDemolishReturns = (level: number, baseCost: Building['buildingCostModifier']): number[] => {
  return calculateBuildCost(level, baseCost).map((baseCostByResource: number) => {
    return roundToNearestN(baseCostByResource * 0.5, 5);
  });
};
