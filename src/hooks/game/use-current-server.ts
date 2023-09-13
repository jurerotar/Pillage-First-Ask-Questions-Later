import { database } from 'database/database';
import { useRouteSegments } from 'hooks/game/routes/use-route-segments';
import { Server } from 'interfaces/models/game/server';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';

export const useCurrentServer = () => {
  const { serverSlug } = useRouteSegments();

  const {
    data: server,
    isLoading: isLoadingServer,
    isSuccess: hasLoadedServer,
    status: serverQueryStatus
  } = useAsyncLiveQuery<Server | undefined>(async () => {
    return database.servers.where({ slug: serverSlug }).first();
  }, [serverSlug]);

  const serverId = server?.id ?? '';

  return {
    server,
    isLoadingServer,
    hasLoadedServer,
    serverQueryStatus,
    serverId
  };
};
