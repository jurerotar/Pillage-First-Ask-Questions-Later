import { database } from 'database/database';
import { Tile } from 'interfaces/models/game/tile';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';

export const useMap = () => {
  const { serverId } = useCurrentServer();

  const {
    data: map,
    isLoading: isLoadingMap,
    isSuccess: hasLoadedMap,
    status: mapQueryStatus
  } = useAsyncLiveQuery<Tile[]>(async () => {
    return database.maps.where({ serverId }).toArray();
  }, [serverId], []);

  return {
    map,
    isLoadingMap,
    hasLoadedMap,
    mapQueryStatus
  };
};
