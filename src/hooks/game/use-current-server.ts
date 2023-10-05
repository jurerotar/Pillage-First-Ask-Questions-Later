import { database } from 'database/database';
import { useRouteSegments } from 'hooks/game/routes/use-route-segments';
import { Server } from 'interfaces/models/game/server';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';

export const currentServerCacheKey = 'current-server';

export const getCurrentServer = (serverSlug: Server['slug']) => database.servers.where({ slug: serverSlug }).first();

export const useCurrentServer = () => {
  const { serverSlug } = useRouteSegments();

  const {
    data: server,
    isLoading: isLoadingServer,
    isSuccess: hasLoadedServer,
    status: serverQueryStatus
  } = useAsyncLiveQuery<Server | undefined>({
    queryFn: () => getCurrentServer(serverSlug),
    deps: [serverSlug],
    cacheKey: currentServerCacheKey
  });

  const serverId = server!.id;

  return {
    server,
    isLoadingServer,
    hasLoadedServer,
    serverQueryStatus,
    serverId
  };
};
