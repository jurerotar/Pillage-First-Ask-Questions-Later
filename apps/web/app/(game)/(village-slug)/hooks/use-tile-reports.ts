import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { Tile } from '@pillage-first/types/models/tile';
import { reportListingsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const useTileReports = (tileId: Tile['id']) => {
  const { apiClient } = use(ApiContext);

  const { data: reports } = useSuspenseQuery({
    queryKey: [reportListingsCacheKey, 'tile', tileId],
    queryFn: async () => {
      const { data } = await apiClient.get('/tiles/:tileId/reports', {
        path: { tileId },
      });

      return data;
    },
  });

  return { reports };
};
