import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { gameWorldOverviewStatisticsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useGameWorldOverview = () => {
  const { apiClient } = use(ApiContext);

  const { data: gameWorldOverviewStatistics } = useSuspenseQuery({
    queryKey: [gameWorldOverviewStatisticsCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/statistics/overview');

      return data;
    },
  });

  return {
    gameWorldOverviewStatistics,
  };
};
