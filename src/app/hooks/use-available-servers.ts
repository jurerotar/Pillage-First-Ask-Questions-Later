import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Server } from 'interfaces/models/game/server';
import { getParsedFileContents, getRootHandle, getServerHandle } from 'app/utils/opfs';

export const availableServerCacheKey = 'available-servers';

export const deleteServerData = async (server: Server) => {
  const opfsServerDirectoryHandle = await getRootHandle();
  await opfsServerDirectoryHandle.removeEntry(server.slug, { recursive: true });
};

export const useAvailableServers = () => {
  const queryClient = useQueryClient();

  const { data: availableServers } = useQuery<Server[]>({
    queryKey: [availableServerCacheKey],
    queryFn: async () => {
      const servers = [];

      const opfsRootDirectoryHandle = await getRootHandle();

      for await (const serverSlug of opfsRootDirectoryHandle.keys()) {
        const opfsServerDirectoryHandle = await getServerHandle(serverSlug);
        const server = await getParsedFileContents<Server>(opfsServerDirectoryHandle, 'server');
        servers.push(server);
      }

      return servers;
    },
    initialData: [],
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
    deleteServer,
  };
};
