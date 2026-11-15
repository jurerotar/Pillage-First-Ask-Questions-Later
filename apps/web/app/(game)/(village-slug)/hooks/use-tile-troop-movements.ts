import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { Tile } from '@pillage-first/types/models/tile';
import { troopMovementsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const useTileTroopMovements = (tileId: Tile['id']) => {
  const { apiClient } = use(ApiContext);

  const { data: troopMovements } = useSuspenseQuery({
    queryKey: [troopMovementsCacheKey, 'tile', tileId],
    queryFn: async () => {
      const { data } = await apiClient.get('/tiles/:tileId/movements', {
        path: { tileId },
      });

      return data;
    },
  });

  return { troopMovements };
};
