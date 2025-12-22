import { useMutation } from '@tanstack/react-query';
import type { Server } from 'app/interfaces/models/game/server';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';
import { toast } from 'sonner';
import type { ExportServerWorkerReturn } from 'app/(public)/workers/export-server-worker';
import ExportServerWorker from 'app/(public)/workers/export-server-worker?worker&url';

const getRootHandle = async (): Promise<FileSystemDirectoryHandle> => {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle('pillage-first-ask-questions-later', {
    create: true,
  });
};

const deleteServerData = async (server: Server) => {
  const rootHandle = await getRootHandle();

  let sawLockedError = false;

  try {
    await rootHandle.removeEntry(server.slug, {
      recursive: true,
    });
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'NoModificationAllowedError'
    ) {
      sawLockedError = true;
    }
  }

  try {
    const legacy_jsonFileName = `${server.slug}.json`;
    await rootHandle.removeEntry(legacy_jsonFileName);
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'NoModificationAllowedError'
    ) {
      sawLockedError = true;
    }
  }

  if (sawLockedError) {
    toast.error("Server couldn't be deleted", {
      description:
        'Database file was still locked by the browser. Try again in a few seconds!',
    });
    return;
  }

  const servers: Server[] = JSON.parse(
    window.localStorage.getItem(availableServerCacheKey) ?? '[]',
  );
  window.localStorage.setItem(
    availableServerCacheKey,
    JSON.stringify(servers.filter(({ id }) => id !== server.id)),
  );
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
      const { databaseBuffer } = await new Promise<ExportServerWorkerReturn>(
        (resolve) => {
          const url = new URL(ExportServerWorker, import.meta.url);
          url.searchParams.set('server-slug', server.slug);
          const worker = new Worker(url.toString(), { type: 'module' });

          worker.addEventListener(
            'message',
            (event: MessageEvent<ExportServerWorkerReturn>) => {
              resolve(event.data);
            },
          );
        },
      );

      const blob = new Blob([databaseBuffer], {
        type: 'application/x-sqlite3',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${server.slug}.sqlite3`;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
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
