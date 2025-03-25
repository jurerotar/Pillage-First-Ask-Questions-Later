import { type Query, QueryClient, useIsRestoring } from '@tanstack/react-query';
import { type PersistedClient, type Persister, PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import { getParsedFileContents, getRootHandle } from 'app/utils/opfs';
import { debounce } from 'moderndash';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import GameSyncWorker from './workers/sync-worker?worker&url';
import { nonPersistedCacheKey } from 'app/(game)/constants/query-keys';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, useRouteError } from 'react-router';

const Fallback = () => {
  return <div>Loader...</div>;
};

const PersisterAwaiter: React.FCWithChildren = ({ children }) => {
  const isRestoring = useIsRestoring();

  if (isRestoring) {
    return <Fallback />;
  }

  return children;
};

export const ErrorBoundary = () => {
  const _error = useRouteError();

  return <p>Persistence provider error</p>;
};

const PersistenceProvider = () => {
  const { serverSlug } = useRouteSegments();

  const gameSyncWorkerRef = useRef<Worker | null>(null);

  const persister = useMemo<Persister>(
    () => ({
      persistClient: debounce(async (client: PersistedClient) => {
        if (!gameSyncWorkerRef.current) {
          return;
        }

        gameSyncWorkerRef.current.postMessage({
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
    if (!gameSyncWorkerRef.current) {
      gameSyncWorkerRef.current = new Worker(GameSyncWorker, { type: 'module' });
    }

    return () => {
      if (gameSyncWorkerRef.current) {
        gameSyncWorkerRef.current.terminate();
        gameSyncWorkerRef.current = null;
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
      <PersisterAwaiter>
        <Outlet />
      </PersisterAwaiter>
      <ReactQueryDevtools
        client={queryClient}
        initialIsOpen={false}
      />
    </PersistQueryClientProvider>
  );
};

export default PersistenceProvider;
