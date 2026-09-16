import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { heroLoadoutCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';
import { useMe } from './use-me';

export const useHeroLoadout = () => {
  const { apiClient } = use(ApiContext);
  const { player } = useMe();

  const { data: heroLoadout } = useSuspenseQuery({
    queryKey: [heroLoadoutCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/players/:playerId/hero/equipped-items',
        {
          path: {
            playerId: player.id,
          },
        },
      );

      return data;
    },
  });

  return {
    heroLoadout,
  };
};
