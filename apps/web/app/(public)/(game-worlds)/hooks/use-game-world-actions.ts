import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Server } from '@pillage-first/types/models/server';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';
import type { ExportServerWorkerReturn } from 'app/(public)/workers/export-server-worker';
import ExportServerWorker from 'app/(public)/workers/export-server-worker?worker&url';
import { invalidateQueries } from 'app/utils/react-query';
import { workerFactory } from 'app/utils/workers';

const LOCK_RETRY_ATTEMPTS = 5;
const LOCK_RETRY_DELAY_MS = 250;

const sleep = async (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const isLockRelatedError = (error: unknown): boolean => {
  if (error instanceof DOMException) {
    return error.name === 'NoModificationAllowedError';
  }

  if (error instanceof Error) {
    return (
      error.message.includes('NoModificationAllowedError') ||
      error.message.includes('createSyncAccessHandle')
    );
  }

  return false;
};

const retryWhenLocked = async <T>(operation: () => Promise<T>): Promise<T> => {
  for (let attempt = 1; attempt <= LOCK_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const isFinalAttempt = attempt === LOCK_RETRY_ATTEMPTS;

      if (!isLockRelatedError(error) || isFinalAttempt) {
        throw error;
      }

      await sleep(LOCK_RETRY_DELAY_MS);
    }
  }

  throw new Error('Unexpected retry state while waiting for lock release.');
};

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
    await retryWhenLocked(() =>
      rootHandle.removeEntry(server.slug, {
        recursive: true,
      }),
    );
  } catch (error) {
    if (isLockRelatedError(error)) {
      sawLockedError = true;
    }
  }

  try {
    const legacy_jsonFileName = `${server.slug}.json`;
    await retryWhenLocked(() => rootHandle.removeEntry(legacy_jsonFileName));
  } catch (error) {
    if (isLockRelatedError(error)) {
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

  const { mutateAsync: exportGameWorld, isPending: isExportGameWorldPending } =
    useMutation<void, Error, { server: Server }>({
      mutationFn: async ({ server }) => {
        const url = new URL(ExportServerWorker, import.meta.url);
        url.searchParams.set('server-slug', server.slug);

        const result = await retryWhenLocked(async () => {
          const workerResult = await workerFactory<
            void,
            ExportServerWorkerReturn
          >(url);

          if (!workerResult.resolved) {
            throw new Error(workerResult.error);
          }

          return workerResult;
        });

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

  const { mutateAsync: deleteGameWorld, isPending: isDeleteGameWorldPending } =
    useMutation<void, Error, { server: Server }>({
      mutationFn: ({ server }) => deleteServerData(server),
      onSuccess: async (_data, _vars, _onMutateResult, context) => {
        await invalidateQueries(context, [[availableServerCacheKey]]);
      },
    });

  return {
    createGameWorld,
    exportGameWorld,
    isExportGameWorldPending,
    deleteGameWorld,
    isDeleteGameWorldPending,
  };
};
