import {
  type DehydratedState,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { Server } from 'app/interfaces/models/game/server';
import { getParsedFileContents, getRootHandle } from 'app/utils/opfs';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';

const deleteServerData = async (server: Server) => {
  try {
    const rootHandle = await getRootHandle();
    // This may fail in case entry was removed by some other means which didn't also remove localStorage
    const jsonFileName = `${server.slug}.json`;
    const sqliteFileName = `${server.slug}.sqlite3`;
    try {
      await rootHandle.getFileHandle(jsonFileName);
      await rootHandle.removeEntry(jsonFileName);
    } catch (_) {}

    try {
      await rootHandle.getFileHandle(sqliteFileName);
      await rootHandle.removeEntry(sqliteFileName);
    } catch (_) {}
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

  const { mutateAsync: exportServer } = useMutation<
    void,
    Error,
    { server: Server }
  >({
    mutationFn: async ({ server }) => {
      const rootHandle = await getRootHandle();
      const state = await getParsedFileContents<DehydratedState>(
        rootHandle,
        server.slug,
      );

      const json = JSON.stringify(state);
      const blob = new Blob([json], { type: 'application/json' });

      const filename = `${server.slug}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  return {
    availableServers,
    addServer,
    deleteServer,
    exportServer,
  };
};
