import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Server } from 'app/interfaces/models/game/server';
import { getRootHandle } from 'app/utils/opfs';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';

const deleteServerData = async (server: Server) => {
  try {
    const rootHandle = await getRootHandle();
    // This may fail in case entry was removed by some other means which didn't also remove localStorage
    await rootHandle.removeEntry(`${server.slug}.json`);
  } finally {
    const servers: Server[] = JSON.parse(
      window.localStorage.getItem(availableServerCacheKey) ?? '[]',
    );
    window.localStorage.setItem(
      availableServerCacheKey,
      JSON.stringify(servers.filter(({ id }) => id !== server.id)),
    );
  }
};

export const useAvailableServers = () => {
  const queryClient = useQueryClient();

  const { data: availableServers } = useQuery<Server[]>({
    queryKey: [availableServerCacheKey],
    queryFn: async () => {
      return JSON.parse(
        window.localStorage.getItem(availableServerCacheKey) ?? '[]',
      );
    },
    initialData: [],
  });

  const { mutate: addServer } = useMutation<void, Error, { server: Server }>({
    mutationFn: async ({ server }) => {
      const servers: Server[] = JSON.parse(
        window.localStorage.getItem(availableServerCacheKey) ?? '[]',
      );
      window.localStorage.setItem(
        availableServerCacheKey,
        JSON.stringify([...servers, server]),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [availableServerCacheKey],
      });
    },
  });

  const { mutateAsync: deleteServer } = useMutation<
    void,
    Error,
    { server: Server }
  >({
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
