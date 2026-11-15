import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { heroInventoryCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const useHeroInventory = () => {
  const { apiClient } = use(ApiContext);

  const { data: heroInventory } = useSuspenseQuery({
    queryKey: [heroInventoryCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/me/hero/inventory');

      return data;
    },
  });

  return {
    heroInventory,
  };
};
