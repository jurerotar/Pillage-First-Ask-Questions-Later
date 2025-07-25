import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import type { Tile } from 'app/interfaces/models/game/tile';
import { parseCoordinatesFromTileId } from 'app/utils/map';
import {
  calculateDistanceBetweenPoints,
  roundTo2DecimalPoints,
} from 'app/utils/common';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { PlayerVillage } from 'app/interfaces/models/game/village';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const useCurrentVillage = () => {
  const { fetcher } = use(ApiContext);
  const { villageSlug } = useRouteSegments();

  const { data: currentVillage } = useSuspenseQuery<PlayerVillage>({
    queryKey: [playerVillagesCacheKey, villageSlug],
    queryFn: async () => {
      const { data } = await fetcher<PlayerVillage>(`/villages/${villageSlug}`);
      return data;
    },
    staleTime: 20_000,
  });

  const getDistanceFromCurrentVillage = (tileId: Tile['id']): number => {
    const villageCoordinates = parseCoordinatesFromTileId(currentVillage!.id);
    const tileCoordinates = parseCoordinatesFromTileId(tileId);
    return roundTo2DecimalPoints(
      calculateDistanceBetweenPoints(villageCoordinates, tileCoordinates),
    );
  };

  return {
    currentVillage,
    getDistanceFromCurrentVillage,
  };
};
