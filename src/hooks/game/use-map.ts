import { database } from 'database/database';
import { Tile } from 'interfaces/models/game/tile';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { useQuery } from '@tanstack/react-query';
import { Server } from 'interfaces/models/game/server';

export const mapCacheKey = 'map';

export const getMap = (serverId: Server['id']) => database.maps.where({ serverId }).toArray();

export const useMap = () => {
  const { serverId } = useCurrentServer();

  const {
    data: map,
    isLoading: isLoadingMap,
    isSuccess: hasLoadedMap,
    status: mapQueryStatus,
  } = useQuery<Tile[]>({
    queryFn: () => getMap(serverId),
    queryKey: [mapCacheKey, serverId],
    initialData: [],
  });

  return {
    map,
    isLoadingMap,
    hasLoadedMap,
    mapQueryStatus,
  };
};
