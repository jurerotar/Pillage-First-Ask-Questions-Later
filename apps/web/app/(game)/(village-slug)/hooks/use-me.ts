import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { playersCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useMe = () => {
  const { apiClient } = use(ApiContext);

  const { data: player } = useSuspenseQuery({
    queryKey: [playersCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/players/me');

      return data;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  return {
    player,
  };
};
