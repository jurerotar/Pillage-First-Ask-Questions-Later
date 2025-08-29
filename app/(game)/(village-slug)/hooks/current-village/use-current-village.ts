import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import type { Tile } from 'app/interfaces/models/game/tile';
import {
  calculateDistanceBetweenPoints,
  roundTo2DecimalPoints,
} from 'app/utils/common';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { Village } from 'app/interfaces/models/game/village';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const useCurrentVillage = () => {
  const { fetcher } = use(ApiContext);
  const { villageSlug } = useRouteSegments();

  const { data: currentVillage } = useSuspenseQuery<Village>({
    queryKey: [playerVillagesCacheKey, villageSlug],
    queryFn: async () => {
      const { data } = await fetcher<Village>(`/villages/${villageSlug}`);
      return data;
    },
    staleTime: 20_000,
  });

  const getDistanceFromCurrentVillage = (
    tileCoordinates: Tile['coordinates'],
  ): number => {
    const villageCoordinates = currentVillage!.coordinates;
    return roundTo2DecimalPoints(
      calculateDistanceBetweenPoints(villageCoordinates, tileCoordinates),
    );
  };

  return {
    currentVillage,
    getDistanceFromCurrentVillage,
  };
};
