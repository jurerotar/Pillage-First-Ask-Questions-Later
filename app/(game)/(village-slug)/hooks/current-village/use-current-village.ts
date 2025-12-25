import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { PlayerVillage } from 'app/interfaces/models/game/village';

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

  return {
    currentVillage,
  };
};
