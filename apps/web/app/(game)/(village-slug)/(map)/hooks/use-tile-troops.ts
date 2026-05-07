import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { Tile } from '@pillage-first/types/models/tile';
import { tileTroopsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useTileTroops = (tileId: Tile['id']) => {
  const { apiClient } = use(ApiContext);

  const { data: tileTroops } = useSuspenseQuery({
    queryKey: [tileTroopsCacheKey, tileId],
    queryFn: async () => {
      const { data } = await apiClient.get('/tiles/:tileId/troops', {
        path: {
          tileId,
        },
      });

      return data;
    },
  });

  return {
    tileTroops,
  };
};
