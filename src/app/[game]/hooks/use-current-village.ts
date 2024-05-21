import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import { useVillages } from 'app/[game]/hooks/use-villages';
import { calculatePopulationFromBuildingFields } from 'app/[game]/utils/common';
import { calculateDistanceBetweenPoints, roundTo2DecimalPoints } from 'app/utils/common';
import type { Point } from 'interfaces/models/common';
import type { Village } from 'interfaces/models/game/village';

export const useCurrentVillage = () => {
  const { playerVillages } = useVillages();
  const { villageSlug } = useRouteSegments();

  // Due to us working with only local data, which is prefetched in loader, we can do this assertion to save us from having to spam "!" everywhere
  const currentVillage: Village = playerVillages.find(({ slug }) => slug === villageSlug)!;

  const currentVillageId = currentVillage!.id;
  const canDemolishBuildings = (currentVillage.buildingFields.find(({ buildingId }) => buildingId === 'MAIN_BUILDING')?.level ?? 0) >= 10;
  const canRearrangeBuildings = (currentVillage.buildingFields.find(({ buildingId }) => buildingId === 'MAIN_BUILDING')?.level ?? 0) >= 15;

  const distanceFromCurrentVillage = (tileCoordinates: Point): number => {
    return roundTo2DecimalPoints(calculateDistanceBetweenPoints(currentVillage.coordinates, tileCoordinates));
  };

  const population = calculatePopulationFromBuildingFields(currentVillage.buildingFields);

  return {
    currentVillage: currentVillage!,
    currentVillageId,
    distanceFromCurrentVillage,
    canDemolishBuildings,
    canRearrangeBuildings,
    population,
  };
};
