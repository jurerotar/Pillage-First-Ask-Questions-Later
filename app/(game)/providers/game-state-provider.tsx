import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider, type PersistedClient, type Persister } from '@tanstack/react-query-persist-client';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import { GameLayoutSkeleton } from 'app/(game)/skeleton';
import { getParsedFileContents, getRootHandle } from 'app/utils/opfs';
import { debounce } from 'moderndash';
import { type FCWithChildren, startTransition, useEffect, useMemo, useRef, useState } from 'react';
import GameSyncWorker from '../workers/sync-worker?worker&url';

export const GameStateProvider: FCWithChildren = ({ children }) => {
  const { serverSlug } = useRouteSegments();

  const gameSyncWorker = useRef<Worker | null>(null);

  const [isRestoring, setIsRestoring] = useState<boolean>(true);

  const persister = useMemo<Persister>(
    () => ({
      persistClient: debounce(async (client: PersistedClient) => {
        gameSyncWorker.current!.postMessage({
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
    if (!gameSyncWorker.current) {
      gameSyncWorker.current = new Worker(GameSyncWorker, { type: 'module' });
    }

    // Cleanup on unmount
    return () => {
      if (gameSyncWorker.current) {
        gameSyncWorker.current.terminate();
        gameSyncWorker.current = null;
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
