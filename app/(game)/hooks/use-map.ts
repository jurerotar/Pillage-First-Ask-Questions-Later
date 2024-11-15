import { useQuery } from '@tanstack/react-query';
import type { Point } from 'app/interfaces/models/common';
import type { Tile } from 'app/interfaces/models/game/tile';
import { mapCacheKey } from 'app/query-keys';

export const useMap = () => {
  const { data: map } = useQuery<Tile[]>({
    queryKey: [mapCacheKey],
    initialData: [],
  });

  const getTileByCoordinates = ({ x, y }: Point): Tile => {
    return map.find(({ coordinates }) => coordinates.x === x && coordinates.y === y)!;
  };

  const getTileByTileId = (tileId: Tile['id']): Tile => {
    return map.find(({ id }) => tileId === id)!;
  };

  return {
    map,
    getTileByCoordinates,
    getTileByTileId,
  };
};
