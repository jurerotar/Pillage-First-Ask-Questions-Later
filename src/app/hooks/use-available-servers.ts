import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { database } from 'database/database';
import type { Server } from 'interfaces/models/game/server';

export const availableServerCacheKey = 'available-servers';

export const deleteServerData = async (serverId: Server['id']) => {
  await Promise.all([
    database.maps.where({ serverId }).delete(),
    database.heroes.where({ serverId }).delete(),
    database.villages.where({ serverId }).delete(),
    database.reports.where({ serverId }).delete(),
    database.quests.where({ serverId }).delete(),
    database.achievements.where({ serverId }).delete(),
    database.events.where({ serverId }).delete(),
    database.effects.where({ serverId }).delete(),
    database.players.where({ serverId }).delete(),
    database.reputations.where({ serverId }).delete(),
    database.mapFilters.where({ serverId }).delete(),
    database.mapMarkers.where({ serverId }).delete(),
    database.troops.where({ serverId }).delete(),
    database.auctions.where({ serverId }).delete(),
    database.adventures.where({ serverId }).delete(),
    database.servers.where({ id: serverId }).delete(),
  ]);
};

export const useAvailableServers = () => {
  const queryClient = useQueryClient();

  const { data: availableServers } = useQuery<Server[]>({
    queryKey: [availableServerCacheKey],
    queryFn: () => database.servers.toArray(),
    initialData: [],
  });

  const { mutateAsync: createServer } = useMutation<void, Error, { server: Server }>({
    mutationFn: async ({ server }) => {
      await database.servers.add(server);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: [availableServerCacheKey],
      });
    },
  });

  const { mutateAsync: deleteServer } = useMutation<void, Error, { server: Server }>({
    mutationFn: async ({ server }) => {
      const { id: serverId } = server;
      await deleteServerData(serverId);
    },
    onMutate: async ({ server }) => {
      await database.servers.where({ id: server.id }).delete();
      await queryClient.invalidateQueries({
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
          lastLoggedInTime: Date.now(),
        },
      };
      await database.servers.put(updatedServer);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: [availableServerCacheKey],
      });
    },
  });

  return {
    availableServers,
    createServer,
    deleteServer,
    updateLastLoggedIn,
  };
};
