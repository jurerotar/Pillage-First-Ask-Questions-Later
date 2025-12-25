import { type DehydratedState, useMutation } from '@tanstack/react-query';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';
import type { Server } from 'app/interfaces/models/game/server';
import { getParsedFileContents, getRootHandle } from 'app/utils/opfs';

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

export const useGameWorldActions = () => {
  const { mutate: createGameWorld } = useMutation<
    void,
    Error,
    { server: Server }
  >({
    mutationFn: async ({ server }) => {
      const servers: Server[] = JSON.parse(
        window.localStorage.getItem(availableServerCacheKey) ?? '[]',
      );
      window.localStorage.setItem(
        availableServerCacheKey,
        JSON.stringify([...servers, server]),
      );
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await context.client.invalidateQueries({
        queryKey: [availableServerCacheKey],
      });
    },
  });

  const { mutateAsync: exportGameWorld } = useMutation<
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

  const { mutateAsync: deleteGameWorld } = useMutation<
    void,
    Error,
    { server: Server }
  >({
    mutationFn: ({ server }) => deleteServerData(server),
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await context.client.invalidateQueries({
        queryKey: [availableServerCacheKey],
      });
    },
  });

  return {
    createGameWorld,
    exportGameWorld,
    deleteGameWorld,
  };
};
