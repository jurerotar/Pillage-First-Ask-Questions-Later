import { database } from 'database/database';
import { Tile } from 'interfaces/models/game/tile';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';

const cacheKey = 'map';

export const useMap = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateMap } = useDatabaseMutation({ cacheKey });

  const {
    data: map,
    isLoading: isLoadingMap,
    isSuccess: hasLoadedMap,
    status: mapQueryStatus
  } = useAsyncLiveQuery<Tile[]>({
    queryFn: () => database.maps.where({ serverId }).toArray(),
    deps: [serverId],
    fallback: [],
    cacheKey,
    enabled: hasLoadedServer
  });

  return {
    map,
    isLoadingMap,
    hasLoadedMap,
    mapQueryStatus
  };
};
