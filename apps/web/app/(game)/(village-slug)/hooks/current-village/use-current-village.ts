import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { VillageSlugContext } from 'app/(game)/(village-slug)/providers/village-slug-provider';
import { currentVillageCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useCurrentVillage = () => {
  const { apiClient } = use(ApiContext);
  const { villageSlug } = use(VillageSlugContext);

  const { data: currentVillage } = useSuspenseQuery({
    queryKey: [currentVillageCacheKey, villageSlug],
    queryFn: async () => {
      const { data } = await apiClient.get('/villages/:villageSlug', {
        path: {
          villageSlug,
        },
      });

      return data;
    },
    staleTime: 20_000,
  });

  return {
    currentVillage,
  };
};
