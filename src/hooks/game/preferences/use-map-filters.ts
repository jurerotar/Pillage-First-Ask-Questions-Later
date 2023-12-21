import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { MapFilters } from 'interfaces/models/game/preferences/map-filters';
import { database } from 'database/database';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';
import { Server } from 'interfaces/models/game/server';
import { useCurrentServer } from 'hooks/game/use-current-server';

export const mapFiltersCacheKey = 'map-filters';

export const getMapFilters = (serverId: Server['id']) => (database.mapFilters.where({ serverId }).first() as Promise<MapFilters>);

export const useMapFilters = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateMapFilters } = useDatabaseMutation({ cacheKey: mapFiltersCacheKey });

  const {
    data: mapFilters,
  } = useAsyncLiveQuery<MapFilters>({
    queryFn: () => getMapFilters(serverId),
    deps: [serverId],
    cacheKey: mapFiltersCacheKey,
    enabled: hasLoadedServer,
  });

  return {
    mapFilters,
    mutateMapFilters,
  };
};
