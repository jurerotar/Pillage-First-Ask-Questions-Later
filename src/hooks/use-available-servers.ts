import { Server } from 'interfaces/models/game/server';
import { database } from 'database/database';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';

export const cacheKey = 'available-servers';

export const useAvailableServers = () => {
  const { mutate: mutateAvailableServers } = useDatabaseMutation({ cacheKey });

  const {
    data: availableServers,
    isLoading: areAvailableServersLoading,
    isSuccess: haveAvailableServersLoaded,
    status: availableServersQueryStatus
  } = useAsyncLiveQuery<Server[]>({
    queryFn: () => database.servers.toArray(),
    fallback: [],
    cacheKey
  });

  const createServer = async (server: Server) => {
    await mutateAvailableServers(async () => {
      await database.servers.add(server, server.id);
    });
  };

  const deleteServer = async (server: Server) => {
    await mutateAvailableServers(async () => {
      const { id: serverId } = server;
      await Promise.all([
        database.servers.delete(server.id),
        database.maps.where({ serverId })
          .delete(),
        database.heroes.where({ serverId })
          .delete(),
        database.villages.where({ serverId })
          .delete(),
        database.reports.where({ serverId })
          .delete(),
        database.quests.where({ serverId })
          .delete(),
        database.achievements.where({ serverId })
          .delete(),
        database.events.where({ serverId })
          .delete(),
        database.effects.where({ serverId })
          .delete(),
        database.banks.where({ serverId })
          .delete(),
        database.researchLevels.where({ serverId })
          .delete(),
        database.players.where({ serverId })
          .delete(),
        database.reputations.where({ serverId })
          .delete()
      ]);
    });
  };

  return {
    availableServers,
    areAvailableServersLoading,
    haveAvailableServersLoaded,
    availableServersQueryStatus,
    createServer,
    deleteServer
  };
};
