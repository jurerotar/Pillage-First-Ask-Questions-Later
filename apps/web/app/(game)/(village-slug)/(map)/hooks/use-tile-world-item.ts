import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { Tile } from '@pillage-first/types/models/tile';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useTileWorldItem = (tileId: Tile['id']) => {
  const { apiClient } = use(ApiContext);

  const { data: worldItem } = useSuspenseQuery({
    queryKey: ['tile-world-item', tileId],
    queryFn: async () => {
      const { data } = await apiClient.get('/tiles/:tileId/world-item', {
        path: {
          tileId,
        },
      });

      return data;
    },
  });

  return {
    worldItem,
  };
};
