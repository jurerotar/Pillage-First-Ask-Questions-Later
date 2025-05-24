import { useSuspenseQuery } from '@tanstack/react-query';
import type { Tile } from 'app/interfaces/models/game/tile';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useMap = () => {
  const { fetcher } = use(ApiContext);

  const { data: map } = useSuspenseQuery<Tile[]>({
    queryKey: ['api'],
    queryFn: async () => {
      const { data } = await fetcher<Tile[]>('/map');
      return data;
    },
  });

  const getTileByTileId = (tileId: Tile['id']): Tile => {
    return map.find(({ id }) => tileId === id)!;
  };

  return {
    map,
    getTileByTileId,
  };
};
