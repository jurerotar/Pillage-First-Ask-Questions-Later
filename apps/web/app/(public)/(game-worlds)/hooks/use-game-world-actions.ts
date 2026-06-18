import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Server } from '@pillage-first/types/models/server';
import {
  isFileSystemLockError,
  retryWhenFileSystemLocked,
} from '@pillage-first/utils/opfs-lock-retry';
import type {
  ImportGameWorldWorkerPayload,
  ImportGameWorldWorkerResponse,
} from 'app/(public)/(game-worlds)/(import)/workers/import-game-world-worker';
import ImportGameWorldWorker from 'app/(public)/(game-worlds)/(import)/workers/import-game-world-worker?worker&url';
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

const getAvailableServers = (): Server[] =>
  JSON.parse(window.localStorage.getItem(availableServerCacheKey) ?? '[]');

const setAvailableServers = (servers: Server[]) => {
  window.localStorage.setItem(availableServerCacheKey, JSON.stringify(servers));
};

const addAvailableServer = (server: Server) => {
  const servers = getAvailableServers();
  setAvailableServers([...servers, server]);
};

const exportServerDatabase = async (server: Server): Promise<ArrayBuffer> => {
  const url = new URL(ExportServerWorker, import.meta.url);
  url.searchParams.set('server-slug', server.slug);

  const result = await retryWhenFileSystemLocked(async () => {
    const workerResult = await workerFactory<void, ExportServerWorkerReturn>(
      url,
    );

    if (!workerResult.resolved) {
      throw new Error(workerResult.error);
    }

    return workerResult;
  });

  return result.databaseBuffer;
};

const importGameWorldDatabase = async (
  databaseBuffer: ArrayBuffer,
): Promise<Server> => {
  const payload: ImportGameWorldWorkerPayload = {
    databaseBuffer,
  };

  const result = await workerFactory<
    ImportGameWorldWorkerPayload,
    ImportGameWorldWorkerResponse
  >(ImportGameWorldWorker, payload);

  if (!result.resolved) {
    throw new Error(result.error || 'Failed to import game world.');
  }

  return result.server;
};

const deleteServerData = async (server: Server) => {
  const rootHandle = await getRootHandle();

  let sawLockedError = false;

  try {
    await retryWhenFileSystemLocked(async () => {
      await rootHandle.removeEntry(server.slug, {
        recursive: true,
      });
    });
  } catch (error) {
    if (isFileSystemLockError(error)) {
      sawLockedError = true;
    }
  }

  try {
    const legacy_jsonFileName = `${server.slug}.json`;
    await retryWhenFileSystemLocked(async () => {
      await rootHandle.removeEntry(legacy_jsonFileName);
    });
  } catch (error) {
    if (isFileSystemLockError(error)) {
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

  const servers = getAvailableServers();
  setAvailableServers(servers.filter(({ id }) => id !== server.id));
};

export const useGameWorldActions = () => {
  const { mutate: createGameWorld } = useMutation<
    void,
    Error,
    { server: Server }
  >({
    mutationFn: async ({ server }) => {
      addAvailableServer(server);
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [[availableServerCacheKey]]);
    },
  });

  const { mutateAsync: exportGameWorld, isPending: isExportGameWorldPending } =
    useMutation<void, Error, { server: Server }>({
      mutationFn: async ({ server }) => {
        const databaseBuffer = await exportServerDatabase(server);

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

        if (isFileSystemLockError(error)) {
          description =
            "The game world can only be exported if there's no current open instance of it.";
        }

        toast.error('Failed to export game world', {
          description,
        });
      },
    });

  const {
    mutateAsync: duplicateGameWorld,
    isPending: isDuplicateGameWorldPending,
  } = useMutation<Server, Error, { server: Server }>({
    mutationFn: async ({ server }) => {
      const databaseBuffer = await exportServerDatabase(server);

      return importGameWorldDatabase(databaseBuffer);
    },
    onSuccess: async (duplicatedServer, _vars, _onMutateResult, context) => {
      addAvailableServer(duplicatedServer);
      await invalidateQueries(context, [[availableServerCacheKey]]);
      toast.success('Game world duplicated');
    },
    onError: (error) => {
      let description = error.message;

      if (isFileSystemLockError(error)) {
        description =
          "The game world can only be duplicated if there's no current open instance of it.";
      }

      toast.error('Failed to duplicate game world', {
        description,
      });
    },
  });

  const { mutateAsync: deleteGameWorld, isPending: isDeleteGameWorldPending } =
    useMutation<void, Error, { server: Server }>({
      mutationFn: async ({ server }) => {
        await deleteServerData(server);
      },
      onSuccess: async (_data, _vars, _onMutateResult, context) => {
        await invalidateQueries(context, [[availableServerCacheKey]]);
      },
    });

  return {
    createGameWorld,
    exportGameWorld,
    isExportGameWorldPending,
    duplicateGameWorld,
    isDuplicateGameWorldPending,
    deleteGameWorld,
    isDeleteGameWorldPending,
  };
};
