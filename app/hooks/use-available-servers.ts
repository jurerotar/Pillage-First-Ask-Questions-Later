import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Server } from 'app/interfaces/models/game/server';
import { getRootHandle } from 'app/utils/opfs';
import { availableServerCacheKey } from 'app/query-keys';

const deleteServerData = async (server: Server) => {
  const rootHandle = await getRootHandle();
  await rootHandle.removeEntry(`${server.slug}.json`);
  const servers: Server[] = JSON.parse(window.localStorage.getItem(availableServerCacheKey) ?? '[]');
  window.localStorage.setItem(availableServerCacheKey, JSON.stringify(servers.filter(({ id }) => id !== server.id)));
};

export const useAvailableServers = () => {
  const queryClient = useQueryClient();

  const { data: availableServers } = useQuery<Server[]>({
    queryKey: [availableServerCacheKey],
    queryFn: () => JSON.parse(window.localStorage.getItem(availableServerCacheKey) ?? '[]'),
    initialData: [],
  });

  const { mutate: addServer } = useMutation<void, Error, { server: Server }>({
    mutationFn: async ({ server }) => {
      const servers: Server[] = JSON.parse(window.localStorage.getItem(availableServerCacheKey) ?? '[]');
      window.localStorage.setItem(availableServerCacheKey, JSON.stringify([...servers, server]));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [availableServerCacheKey],
      });
    },
  });

  const { mutateAsync: deleteServer } = useMutation<void, Error, { server: Server }>({
    mutationFn: ({ server }) => deleteServerData(server),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [availableServerCacheKey],
      });
    },
  });

  return {
    availableServers,
    addServer,
    deleteServer,
  };
};
