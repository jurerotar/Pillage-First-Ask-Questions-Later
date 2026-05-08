import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { effectsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useEffects = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: effects } = useSuspenseQuery({
    queryKey: [effectsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/villages/:villageId/effects', {
        path: {
          villageId: currentVillage.id,
        },
      });

      return data;
    },
  });

  return {
    effects,
  };
};
