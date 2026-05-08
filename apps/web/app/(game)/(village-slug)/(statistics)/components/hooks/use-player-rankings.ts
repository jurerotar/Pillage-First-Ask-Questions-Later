import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { playerRankingsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const usePlayerRankings = () => {
  const { apiClient } = use(ApiContext);

  const { data: rankedPlayers } = useSuspenseQuery({
    queryKey: [playerRankingsCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/statistics/players', {
        query: {
          lastPlayerId: null,
        },
      });

      return data;
    },
  });

  return {
    rankedPlayers,
  };
};
