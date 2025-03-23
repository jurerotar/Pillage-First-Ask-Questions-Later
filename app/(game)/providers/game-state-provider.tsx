import { type Query, QueryClient, useIsRestoring } from '@tanstack/react-query';
import { type PersistedClient, type Persister, PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import { getParsedFileContents, getRootHandle } from 'app/utils/opfs';
import { debounce } from 'moderndash';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Fallback } from 'app/(game)/layout';
import GameSyncWorker from '../workers/sync-worker?worker&url';
import { nonPersistedCacheKey } from 'app/(game)/constants/query-keys';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const PersisterAwaiter: React.FCWithChildren = ({ children }) => {
  const isRestoring = useIsRestoring();

  if (isRestoring) {
    return <Fallback />;
  }

  return children;
};

let gameSyncWorker: Worker | null = null;

export const GameStateProvider: React.FCWithChildren = ({ children }) => {
  const { serverSlug } = useRouteSegments();

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
        const serverState = await getParsedFileContents<PersistedClient>(rootHandle, serverSlug);
        return serverState;
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
          queryFn: () => {},
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
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: Number.MAX_VALUE,
        dehydrateOptions: {
          shouldDehydrateQuery: ({ queryHash }: Query) => {
            return !queryHash.includes(nonPersistedCacheKey);
          },
        },
      }}
    >
      <PersisterAwaiter>{children}</PersisterAwaiter>
      <ReactQueryDevtools
        client={queryClient}
        initialIsOpen={false}
      />
    </PersistQueryClientProvider>
  );
};
