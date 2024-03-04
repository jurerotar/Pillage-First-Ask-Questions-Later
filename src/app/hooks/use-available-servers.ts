import { Server } from 'interfaces/models/game/server';
import { database } from 'database/database';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const availableServerCacheKey = 'available-servers';

export const useAvailableServers = () => {
  const queryClient = useQueryClient();

  const {
    data: availableServers,
    isLoading: areAvailableServersLoading,
    isSuccess: haveAvailableServersLoaded,
    status: availableServersQueryStatus,
  } = useQuery<Server[]>({
    queryKey: [availableServerCacheKey],
    queryFn: () => database.servers.toArray(),
    initialData: [],
  });

  const { mutateAsync: createServer } = useMutation<void, Error, { server: Server }>({
    mutationFn: async ({ server }) => {
      await database.servers.add(server);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [availableServerCacheKey],
      });
    },
  });

  const { mutateAsync: deleteServer } = useMutation<void, Error, { server: Server }>({
    mutationFn: async ({ server }) => {
      const { id: serverId } = server;
      await Promise.all([
        database.maps.where({ serverId }).delete(),
        database.heroes.where({ serverId }).delete(),
        database.villages.where({ serverId }).delete(),
        database.reports.where({ serverId }).delete(),
        database.quests.where({ serverId }).delete(),
        database.achievements.where({ serverId }).delete(),
        database.events.where({ serverId }).delete(),
        database.effects.where({ serverId }).delete(),
        database.banks.where({ serverId }).delete(),
        database.researchLevels.where({ serverId }).delete(),
        database.players.where({ serverId }).delete(),
        database.reputations.where({ serverId }).delete(),
        database.mapFilters.where({ serverId }).delete(),
      ]);
    },
    onMutate: async ({ server }) => {
      await database.servers.where({ id: server.id }).delete();
      queryClient.invalidateQueries({
        queryKey: [availableServerCacheKey],
      });
    },
  });

  const { mutateAsync: updateLastLoggedIn } = useMutation<void, Error, { server: Server }>({
    mutationFn: async ({ server }) => {
      const updatedServer = {
        ...server,
        statistics: {
          ...server.statistics,
          lastLoggedInTime: Date.now()
        }
      }
      await database.servers.put(updatedServer);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [availableServerCacheKey],
      });
    },
  });

  return {
    availableServers,
    areAvailableServersLoading,
    haveAvailableServersLoaded,
    availableServersQueryStatus,
    createServer,
    deleteServer,
    updateLastLoggedIn,
  };
};
