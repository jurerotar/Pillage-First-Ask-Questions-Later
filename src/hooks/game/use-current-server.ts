import { database } from 'database/database';
import { useServerName } from 'hooks/game/routes/use-server-name';
import { Server } from 'interfaces/models/game/server';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';

export const useCurrentServer = () => {
  const { serverName } = useServerName();

  const {
    data: server,
    isLoading: isLoadingServer,
    isSuccess: hasLoadedServer,
    status: serverQueryStatus
  } = useAsyncLiveQuery<Server | undefined>(async () => {
    return database.servers.where({ name: serverName }).first();
  }, [serverName]);

  const serverId = server?.id ?? '';

  return {
    server,
    isLoadingServer,
    hasLoadedServer,
    serverQueryStatus,
    serverId
  };
};
