import { QueryClient } from '@tanstack/react-query';
import { type PersistedClient, type Persister, PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import { GameLayoutSkeleton } from 'app/(game)/skeleton';
import { getParsedFileContents, getRootHandle } from 'app/utils/opfs';
import { debounce } from 'moderndash';
import type React from 'react';
import { startTransition, useEffect, useMemo, useState } from 'react';
import GameSyncWorker from '../workers/sync-worker?worker&url';

let gameSyncWorker: Worker | null = null;

export const GameStateProvider: React.FCWithChildren = ({ children }) => {
  const { serverSlug } = useRouteSegments();

  const [isRestoring, setIsRestoring] = useState<boolean>(true);

  const persister = useMemo<Persister>(
    () => ({
      persistClient: debounce(async (client: PersistedClient) => {
        if (!gameSyncWorker) {
          return;
        }

        gameSyncWorker.postMessage({
          client,
          serverSlug,
        });
      }, 300),
      restoreClient: async () => {
        const rootHandle = await getRootHandle();
        return getParsedFileContents<PersistedClient>(rootHandle, serverSlug);
      },
      removeClient: () => {},
    }),
    [serverSlug],
  );

  const [queryClient] = useState<QueryClient>(
    new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: Number.POSITIVE_INFINITY,
          networkMode: 'always',
          staleTime: Number.POSITIVE_INFINITY,
        },
        mutations: {
          networkMode: 'always',
        },
      },
    }),
  );

  useEffect(() => {
    if (!gameSyncWorker) {
      gameSyncWorker = new Worker(GameSyncWorker, { type: 'module' });
    }

    return () => {
      if (gameSyncWorker) {
        gameSyncWorker.terminate();
        gameSyncWorker = null;
      }
    };
  }, []);

  return (
    <PersistQueryClientProvider
      persistOptions={{
        persister,
        maxAge: Number.MAX_VALUE,
      }}
      client={queryClient}
      onSuccess={() => {
        startTransition(() => {
          setIsRestoring(false);
        });
      }}
    >
      {isRestoring && <GameLayoutSkeleton />}
      {!isRestoring && children}
    </PersistQueryClientProvider>
  );
};
