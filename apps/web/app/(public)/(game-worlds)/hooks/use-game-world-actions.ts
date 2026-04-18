import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Server } from '@pillage-first/types/models/server';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';
import type { ExportServerWorkerReturn } from 'app/(public)/workers/export-server-worker';
import ExportServerWorker from 'app/(public)/workers/export-server-worker?worker&url';
import { invalidateQueries } from 'app/utils/react-query';
import { workerFactory } from 'app/utils/workers';

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
        "The game world can only be deleted if there's no current open instance of it.",
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
      await invalidateQueries(context, [[availableServerCacheKey]]);
    },
  });

  const { mutateAsync: exportGameWorld } = useMutation<
    void,
    Error,
    { server: Server }
  >({
    mutationFn: async ({ server }) => {
      const url = new URL(ExportServerWorker, import.meta.url);
      url.searchParams.set('server-slug', server.slug);

      const result = await workerFactory<void, ExportServerWorkerReturn>(url);

      if (!result.resolved) {
        throw new Error(result.error);
      }

      const { databaseBuffer } = result;

      const blob = new Blob([databaseBuffer], {
        type: 'application/x-sqlite3',
      });

      const exportUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = exportUrl;
      a.download = `${server.slug}.sqlite3`;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(exportUrl);
    },
    onError: (error) => {
      let description = error.message;

      if (
        error.message.includes('NoModificationAllowedError') ||
        error.message.includes('createSyncAccessHandle')
      ) {
        description =
          "The game world can only be exported if there's no current open instance of it.";
      }

      toast.error('Failed to export game world', {
        description,
      });
    },
  });

  const { mutateAsync: deleteGameWorld } = useMutation<
    void,
    Error,
    { server: Server }
  >({
    mutationFn: ({ server }) => deleteServerData(server),
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [[availableServerCacheKey]]);
    },
  });

  return {
    createGameWorld,
    exportGameWorld,
    deleteGameWorld,
  };
};
