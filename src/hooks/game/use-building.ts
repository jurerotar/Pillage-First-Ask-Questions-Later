import { Building } from 'interfaces/models/game/building';
import { buildings } from 'assets/buildings';
import { useCurrentResources } from 'hooks/game/use-current-resources';

export const useBuilding = (buildingId: Building['id'], level: number) => {
  const { resources } = useCurrentResources();

  const buildingData: Building = buildings.find(({ id }) => id === buildingId)!;
  const isMaxLevel = buildingData.cropConsumption.length === level;
  const canUpgradeBuilding = (() => {
    if (isMaxLevel) {
      return false;
    }
    const currentResourceArray = Object.values(resources);
    const nextLevelRequirements = buildingData.buildingCost[level];
    return nextLevelRequirements.every((requiredResource, index) => requiredResource <= currentResourceArray[index]);
  })();

  return {
    isMaxLevel,
    canUpgradeBuilding
  };
};
