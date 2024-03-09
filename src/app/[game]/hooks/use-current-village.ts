import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import { Village } from 'interfaces/models/game/village';
import { calculateDistanceBetweenPoints, roundTo2DecimalPoints } from 'app/utils/common';
import { Point } from 'interfaces/models/common';
import { useVillages } from 'app/[game]/hooks/use-villages';

export const currentVillageCacheKey = 'current-village';

export const useCurrentVillage = () => {
  const { playerVillages } = useVillages();
  const { villageSlug } = useRouteSegments();

  // Due to us working with only local data, which is prefetched in loader, we can do this assertion to save us from having to spam "!" everywhere
  const currentVillage: Village = playerVillages.find(({ slug}) => slug === villageSlug)!;

  const currentVillageId = currentVillage!.id;

  const distanceFromCurrentVillage = (tileCoordinates: Point): number => {
    return roundTo2DecimalPoints(calculateDistanceBetweenPoints(currentVillage.coordinates, tileCoordinates));
  };

  return {
    currentVillage: currentVillage!,
    currentVillageId,
    distanceFromCurrentVillage,
  };
};
