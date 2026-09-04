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
import { getPinnedServerIds } from 'app/(public)/(game-worlds)/utils/game-world-listing';
import type {
  RenameGameWorldWorkerPayload,
  RenameGameWorldWorkerResponse,
} from 'app/(public)/(game-worlds)/workers/rename-game-world-worker';
import RenameGameWorldWorker from 'app/(public)/(game-worlds)/workers/rename-game-world-worker?worker&url';
import {
  availableServerCacheKey,
  pinnedServerIdsCacheKey,
} from 'app/(public)/constants/query-keys';
import type { ExportServerWorkerReturn } from 'app/(public)/workers/export-server-worker';
import ExportServerWorker from 'app/(public)/workers/export-server-worker?worker&url';
import {
  pushGameWorldDeleted,
  pushGameWorldDuplicated,
  pushGameWorldExported,
} from 'app/instrumentation/product-events';
import { reportError } from 'app/instrumentation/report-error';
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

const setPinnedServerIds = (serverIds: string[]) => {
  window.localStorage.setItem(
    pinnedServerIdsCacheKey,
    JSON.stringify(serverIds),
  );
};

const addAvailableServer = (server: Server) => {
  const servers = getAvailableServers();
  setAvailableServers([...servers, server]);
};

const removeAvailableServer = (server: Server): Server[] => {
  const servers = getAvailableServers();
  const updatedServers = servers.filter(({ id }) => id !== server.id);
  setAvailableServers(updatedServers);

  return updatedServers;
};

const updateAvailableServer = (updatedServer: Server): Server[] => {
  const updatedServers = getAvailableServers().map((server) =>
    server.id === updatedServer.id ? updatedServer : server,
  );
  setAvailableServers(updatedServers);

  return updatedServers;
};

const isNotFoundError = (error: unknown) =>
  error instanceof DOMException && error.name === 'NotFoundError';

type ServerStorageStatus = 'empty-directory' | 'missing-directory' | 'present';

const getServerStorageStatus = async (
  rootHandle: FileSystemDirectoryHandle,
  server: Server,
): Promise<ServerStorageStatus> => {
  let serverDirectoryHandle: FileSystemDirectoryHandle;

  try {
    serverDirectoryHandle = await rootHandle.getDirectoryHandle(server.slug);
  } catch (error) {
    if (isNotFoundError(error)) {
      return 'missing-directory';
    }

    throw error;
  }

  for await (const _entry of serverDirectoryHandle.entries()) {
    return 'present';
  }

  return 'empty-directory';
};

const reportMissingServerDatabase = (
  server: Server,
  storageStatus: Exclude<ServerStorageStatus, 'present'>,
): void => {
  reportError(
    new Error('Server card references missing game world database'),
    'Server card references missing game world database',
    {
      serverId: server.id,
      serverName: server.name,
      serverSlug: server.slug,
      source: 'deleteGameWorld',
      storageStatus,
    },
  );
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
  >(ImportGameWorldWorker, payload, [payload.databaseBuffer]);

  if (!result.resolved) {
    throw new Error(result.error || 'Failed to import game world.');
  }

  return result.server;
};

const deleteServerData = async (server: Server): Promise<Server[] | null> => {
  const rootHandle = await getRootHandle();
  const serverStorageStatus = await getServerStorageStatus(rootHandle, server);
  let missingServerDatabaseReported = false;

  if (serverStorageStatus !== 'present') {
    reportMissingServerDatabase(server, serverStorageStatus);
    missingServerDatabaseReported = true;
  }

  try {
    await retryWhenFileSystemLocked(async () => {
      await rootHandle.removeEntry(server.slug, {
        recursive: true,
      });
    });
  } catch (error) {
    if (isFileSystemLockError(error)) {
      toast.error("Server couldn't be deleted", {
        description:
          "The game world can only be deleted if there's no current open instance of it.",
      });

      return null;
    }

    if (!isNotFoundError(error)) {
      throw error;
    }

    if (!missingServerDatabaseReported) {
      reportMissingServerDatabase(server, 'missing-directory');
    }
  }

  return removeAvailableServer(server);
};

export const useGameWorldActions = () => {
  const { mutateAsync: createGameWorld } = useMutation<
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
      onSuccess: async (_data, { server }, _onMutateResult, context) => {
        pushGameWorldExported(server);
        await invalidateQueries(context, [[availableServerCacheKey]]);
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
      pushGameWorldDuplicated(duplicatedServer);
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
    useMutation<Server[] | null, Error, { server: Server }>({
      mutationFn: async ({ server }) => {
        const updatedServers = await deleteServerData(server);

        if (updatedServers) {
          setPinnedServerIds(
            getPinnedServerIds().filter((serverId) => serverId !== server.id),
          );
        }

        return updatedServers;
      },
      onSuccess: async (
        updatedServers,
        { server },
        _onMutateResult,
        context,
      ) => {
        if (!updatedServers) {
          return;
        }

        pushGameWorldDeleted(server);
        context.client.setQueryData([availableServerCacheKey], updatedServers);
        await invalidateQueries(context, [[availableServerCacheKey]]);
      },
      onError: (error) => {
        toast.error('Failed to delete game world', {
          description: error.message,
        });
      },
    });

  const { mutateAsync: renameGameWorld, isPending: isRenameGameWorldPending } =
    useMutation<Server[], Error, { server: Server; name: string }>({
      mutationFn: async ({ server, name }) => {
        const trimmedName = name.trim();
        const result = await workerFactory<
          RenameGameWorldWorkerPayload,
          RenameGameWorldWorkerResponse
        >(RenameGameWorldWorker, {
          serverId: server.id,
          serverSlug: server.slug,
          name: trimmedName,
        });

        if (!result.resolved) {
          throw new Error(result.error);
        }

        return updateAvailableServer({ ...server, name: trimmedName });
      },
      onSuccess: async (updatedServers, _vars, _onMutateResult, context) => {
        context.client.setQueryData([availableServerCacheKey], updatedServers);
        await invalidateQueries(context, [[availableServerCacheKey]]);
        toast.success('Game world renamed');
      },
      onError: (error) => {
        let description = error.message;

        if (isFileSystemLockError(error)) {
          description =
            "The game world can only be renamed if there's no current open instance of it.";
        }

        toast.error('Failed to rename game world', { description });
      },
    });

  const { mutateAsync: toggleGameWorldPin, isPending: isPinGameWorldPending } =
    useMutation<string[], Error, { server: Server }>({
      mutationFn: async ({ server }) => {
        const pinnedServerIds = getPinnedServerIds();
        const updatedPinnedServerIds = pinnedServerIds.includes(server.id)
          ? pinnedServerIds.filter((serverId) => serverId !== server.id)
          : [...pinnedServerIds, server.id];

        setPinnedServerIds(updatedPinnedServerIds);
        return updatedPinnedServerIds;
      },
      onSuccess: async (_data, _vars, _onMutateResult, context) => {
        await invalidateQueries(context, [[availableServerCacheKey]]);
      },
      onError: (error) => {
        toast.error('Failed to update pinned game worlds', {
          description: error.message,
        });
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
    renameGameWorld,
    isRenameGameWorldPending,
    toggleGameWorldPin,
    isPinGameWorldPending,
  };
};
