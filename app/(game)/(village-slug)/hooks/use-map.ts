import { useQuery } from '@tanstack/react-query';
import type { Tile } from 'app/interfaces/models/game/tile';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useMap = () => {
  const { workerFetch } = use(ApiContext);

  const { data: map, isFetching: isFetchingMap } = useQuery<Tile[]>({
    queryKey: ['api'],
    queryFn: async () => {
      const { data } = await workerFetch<void, Tile[]>('/map');
      return data;
    },
    staleTime: 0,
    initialData: [],
  });

  const getTileByTileId = (tileId: Tile['id']): Tile => {
    return map.find(({ id }) => tileId === id)!;
  };

  return {
    map,
    isFetchingMap,
    getTileByTileId,
  };
};
