import {
  type DehydratedState,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { Server } from 'app/interfaces/models/game/server';
import { getParsedFileContents, getRootHandle } from 'app/utils/opfs';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('public');
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
      toast.success(t('Server was deleted successfully.'));
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

      const filename = `${server.slug}-state.json`;

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
