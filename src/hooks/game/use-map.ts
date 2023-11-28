import { database } from 'database/database';
import { Tile } from 'interfaces/models/game/tile';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';
import { Server } from 'interfaces/models/game/server';

export const mapCacheKey = 'map';

export const getMap = (serverId: Server['id']) => database.maps.where({ serverId }).toArray();

export const useMap = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateMap } = useDatabaseMutation({ cacheKey: mapCacheKey });

  const {
    data: map,
    isLoading: isLoadingMap,
    isSuccess: hasLoadedMap,
    status: mapQueryStatus,
  } = useAsyncLiveQuery<Tile[]>({
    queryFn: () => getMap(serverId),
    deps: [serverId],
    fallback: [],
    cacheKey: mapCacheKey,
    enabled: hasLoadedServer,
  });

  return {
    map,
    isLoadingMap,
    hasLoadedMap,
    mapQueryStatus,
    mutateMap,
  };
};
