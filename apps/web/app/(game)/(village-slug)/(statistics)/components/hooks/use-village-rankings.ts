import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { villageRankingsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useVillageRankings = () => {
  const { apiClient } = use(ApiContext);

  const { data: rankedVillages } = useSuspenseQuery({
    queryKey: [villageRankingsCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/statistics/villages', {
        query: {
          lastVillageId: null,
        },
      });

      return data;
    },
  });

  return {
    rankedVillages,
  };
};
