import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { trapperCagesCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useTrapperCageStats = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: trapperCageStats } = useSuspenseQuery({
    queryKey: [trapperCagesCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/villages/:villageId/trapper-cages',
        {
          path: {
            villageId: currentVillage.id,
          },
        },
      );

      return data;
    },
  });

  return {
    trapperCageStats,
  };
};
