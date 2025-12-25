import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { Report } from 'app/interfaces/models/game/report';
import type { Tile } from 'app/interfaces/models/game/tile';

export const useTileReports = (tileId: Tile['id']) => {
  const { fetcher } = use(ApiContext);

  const { data: reports } = useSuspenseQuery<Report[]>({
    queryKey: ['tile-reports', tileId],
    queryFn: async () => {
      const { data } = await fetcher<Report[]>(`/tiles/${tileId}/reports`);
      return data;
    },
  });

  return {
    reports,
  };
};
