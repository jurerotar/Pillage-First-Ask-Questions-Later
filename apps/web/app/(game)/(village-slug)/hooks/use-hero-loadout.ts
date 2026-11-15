import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { heroLoadoutCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const useHeroLoadout = () => {
  const { apiClient } = use(ApiContext);

  const { data: heroLoadout } = useSuspenseQuery({
    queryKey: [heroLoadoutCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/me/hero/equipped-items');

      return data;
    },
  });

  return {
    heroLoadout,
  };
};
