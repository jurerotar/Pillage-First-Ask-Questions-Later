import { useVillages } from 'app/(game)/hooks/use-villages';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import { calculatePopulationFromBuildingFields } from 'app/(game)/utils/building';
import { useQuery } from '@tanstack/react-query';
import type { Village } from 'app/interfaces/models/game/village';
import { nonPersistedCacheKey } from 'app/(game)/constants/query-keys';
import type { Tile } from 'app/interfaces/models/game/tile';
import { parseCoordinatesFromTileId } from 'app/utils/map-tile';
import { calculateDistanceBetweenPoints, roundTo2DecimalPoints } from 'app/utils/common';

export const useCurrentVillage = () => {
  const { playerVillages } = useVillages();
  const { villageSlug } = useRouteSegments();

  const getCurrentVillage = () => playerVillages.find(({ slug }) => slug === villageSlug)!;

  const { data: currentVillage } = useQuery<Village>({
    queryKey: [nonPersistedCacheKey, 'current-village', playerVillages],
    queryFn: getCurrentVillage,
    initialData: getCurrentVillage,
    initialDataUpdatedAt: Date.now(),
    queryKeyHashFn: () => {
      const playerVillagesHash = playerVillages.map((village) => `${village.id}-${village.lastUpdatedAt}`).join('|');
      return `current-village-${nonPersistedCacheKey}-${playerVillagesHash}`;
    },
  });

  const getCurrentVillagePopulation = () =>
    calculatePopulationFromBuildingFields(currentVillage.buildingFields, currentVillage.buildingFieldsPresets);

  const { data: currentVillagePopulation } = useQuery<number>({
    queryKey: ['current-village-population', nonPersistedCacheKey, currentVillage.id],
    queryFn: getCurrentVillagePopulation,
    initialData: getCurrentVillagePopulation,
    initialDataUpdatedAt: Date.now(),
  });

  const distanceFromCurrentVillage = (tileId: Tile['id']): number => {
    const villageCoordinates = parseCoordinatesFromTileId(currentVillage!.id);
    const tileCoordinates = parseCoordinatesFromTileId(tileId);
    return roundTo2DecimalPoints(calculateDistanceBetweenPoints(villageCoordinates, tileCoordinates));
  };

  return {
    currentVillage,
    distanceFromCurrentVillage,
    currentVillagePopulation,
  };
};
