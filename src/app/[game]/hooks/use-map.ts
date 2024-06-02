import { useQuery } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import type { Point } from 'interfaces/models/common';
import type { Tile } from 'interfaces/models/game/tile';
import { getParsedFileContents } from 'app/utils/opfs';

export const mapCacheKey = 'map';

export const useMap = () => {
  const { serverHandle } = useCurrentServer();

  const { data: map } = useQuery<Tile[]>({
    queryFn: () => getParsedFileContents<Tile[]>(serverHandle, 'map'),
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
