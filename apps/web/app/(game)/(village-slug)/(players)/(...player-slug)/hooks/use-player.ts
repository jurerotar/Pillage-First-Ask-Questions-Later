import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { Player } from '@pillage-first/types/models/player';
import { playerCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const usePlayer = (playerSlug: Player['slug']) => {
  const { apiClient } = use(ApiContext);

  const { data: player } = useSuspenseQuery({
    queryKey: [playerCacheKey, playerSlug],
    queryFn: async () => {
      const { data } = await apiClient.get('/players/:playerSlug', {
        path: {
          playerSlug,
        },
      });

      return data;
    },
  });

  return {
    player,
  };
};
