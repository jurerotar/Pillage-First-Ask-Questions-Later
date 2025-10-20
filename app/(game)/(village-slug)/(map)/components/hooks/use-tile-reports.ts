import { useSuspenseQuery } from '@tanstack/react-query';
import type { Report } from 'app/interfaces/models/game/report';
import type { Tile } from 'app/interfaces/models/game/tile';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useTileReports = (tileId: Tile['id']) => {
  const { fetcher } = use(ApiContext);

  const { data: reports } = useSuspenseQuery({
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
