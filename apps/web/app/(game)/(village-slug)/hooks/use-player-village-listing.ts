import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { villageListingCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const usePlayerVillageListing = () => {
  const { apiClient } = use(ApiContext);

  const { data: playerVillages } = useSuspenseQuery({
    queryKey: [villageListingCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/me/villages');

      return data;
    },
  });

  return {
    playerVillages,
  };
};
