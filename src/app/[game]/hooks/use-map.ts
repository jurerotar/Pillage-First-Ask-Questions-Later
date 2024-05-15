import { useQuery } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { database } from 'database/database';
import type { Point } from 'interfaces/models/common';
import type { Server } from 'interfaces/models/game/server';
import type { Tile } from 'interfaces/models/game/tile';

export const mapCacheKey = 'map';

export const getMap = (serverId: Server['id']) => database.maps.where({ serverId }).toArray();

export const useMap = () => {
  const { serverId } = useCurrentServer();

  const { data: map } = useQuery<Tile[]>({
    queryFn: () => getMap(serverId),
    queryKey: [mapCacheKey, serverId],
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
