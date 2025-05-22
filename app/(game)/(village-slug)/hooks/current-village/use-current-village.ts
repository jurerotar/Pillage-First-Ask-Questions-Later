import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { calculatePopulationFromBuildingFields } from 'app/(game)/(village-slug)/utils/building';
import type { Tile } from 'app/interfaces/models/game/tile';
import { parseCoordinatesFromTileId } from 'app/utils/map-tile';
import { calculateDistanceBetweenPoints, roundTo2DecimalPoints } from 'app/utils/common';
import { usePlayerVillages } from 'app/(game)/(village-slug)/hooks/use-player-villages';
import { useQuery } from '@tanstack/react-query';
import type { PlayerVillage } from 'app/interfaces/models/game/village';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useCurrentVillage = () => {
  const { workerFetch } = use(ApiContext);
  const { playerVillages } = usePlayerVillages();
  const { villageSlug } = useRouteSegments();

  const { data: _data } = useQuery<PlayerVillage>({
    queryKey: ['current-village', villageSlug],
    queryFn: async () => {
      const { data } = await workerFetch<'/villages/:villageSlug', 'GET'>(`/villages/${villageSlug}`);
      return data;
    },
    staleTime: 0,
  });

  const currentVillage = playerVillages.find(({ slug }) => slug === villageSlug)!;

  const getCurrentVillagePopulation = () =>
    calculatePopulationFromBuildingFields(currentVillage.buildingFields, currentVillage.buildingFieldsPresets);

  const getDistanceFromCurrentVillage = (tileId: Tile['id']): number => {
    const villageCoordinates = parseCoordinatesFromTileId(currentVillage!.id);
    const tileCoordinates = parseCoordinatesFromTileId(tileId);
    return roundTo2DecimalPoints(calculateDistanceBetweenPoints(villageCoordinates, tileCoordinates));
  };

  return {
    currentVillage,
    getDistanceFromCurrentVillage,
    getCurrentVillagePopulation,
  };
};
