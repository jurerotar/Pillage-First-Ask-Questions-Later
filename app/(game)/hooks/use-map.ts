import { useQuery } from '@tanstack/react-query';
import type { Tile } from 'app/interfaces/models/game/tile';
import { mapCacheKey } from 'app/(game)/constants/query-keys';

export const useMap = () => {
  const { data: map } = useQuery<Tile[]>({
    queryKey: [mapCacheKey],
    initialData: [],
  });

  const getTileByTileId = (tileId: Tile['id']): Tile => {
    return map.find(({ id }) => tileId === id)!;
  };

  return {
    map,
    getTileByTileId,
  };
};
