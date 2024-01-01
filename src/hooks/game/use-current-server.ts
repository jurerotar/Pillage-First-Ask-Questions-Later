import { database } from 'database/database';
import { useRouteSegments } from 'hooks/game/routes/use-route-segments';
import { Server } from 'interfaces/models/game/server';
import { useQuery } from '@tanstack/react-query';

export const currentServerCacheKey = 'current-server';

export const getCurrentServer = (serverSlug: Server['slug']) => database.servers.where({ slug: serverSlug }).first() as Promise<Server>;

export const useCurrentServer = () => {
  const { serverSlug } = useRouteSegments();

  const {
    data,
    isLoading: isLoadingServer,
    isSuccess: hasLoadedServer,
    status: serverQueryStatus,
  } = useQuery<Server>({
    queryKey: [currentServerCacheKey, serverSlug],
    queryFn: () => getCurrentServer(serverSlug),
  });

  // Due to us working with only local data, which is prefetched in loader, we can do this assertion to save us from having to spam "!" everywhere
  const server = data as Server;

  const serverId = server.id;

  return {
    server,
    isLoadingServer,
    hasLoadedServer,
    serverQueryStatus,
    serverId,
  };
};
