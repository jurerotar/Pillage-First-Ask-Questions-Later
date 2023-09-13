import { Server } from 'interfaces/models/game/server';
import { database } from 'database/database';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';

export const useAvailableServers = () => {
  const {
    data: availableServers,
    isLoading: areAvailableServersLoading,
    isSuccess: haveAvailableServersLoaded,
    status: availableServersQueryStatus
  } = useAsyncLiveQuery<Server[]>(async () => {
    return database.servers.toArray();
  }, [], []);

  const createServer = async (server: Server) => {
    await database.servers.add(server, server.id);
  };

  const deleteServer = async (server: Server) => {
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
      database.researchLevels.where({ serverId })
        .delete(),
      database.events.where({ serverId })
        .delete(),
      database.effects.where({ serverId })
        .delete()
    ]);
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
