import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { Tile } from '@pillage-first/types/models/tile';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useOasisBonuses = (tileId: Tile['id']) => {
  const { apiClient } = use(ApiContext);

  const { data: oasisBonuses } = useSuspenseQuery({
    queryKey: ['oasis-bonuses', tileId],
    queryFn: async () => {
      const { data } = await apiClient.get('/tiles/:tileId/bonuses', {
        path: {
          tileId,
        },
      });

      return data;
    },
  });

  return {
    oasisBonuses,
  };
};
