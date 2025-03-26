import { type Query, QueryClient } from '@tanstack/react-query';
import { type PersistedClient, type Persister, PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { getParsedFileContents, getRootHandle } from 'app/utils/opfs';
import { debounce } from 'moderndash';
import { useEffect, useRef, useState } from 'react';
import { nonPersistedCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, useLoaderData } from 'react-router';
import GameSyncWorker from './workers/sync-worker?worker&url';
import { PersisterAwaiter } from 'app/(game)/components/persister-awaiter';
import type { Route } from '.react-router/types/app/(game)/+types/layout';

const Fallback = () => {
  return <div>Loader...</div>;
};

export const clientLoader = async ({ params }: Route.ClientLoaderArgs) => {
  const { serverSlug } = params;

  const rootHandle = await getRootHandle();
  const serverState = await getParsedFileContents<PersistedClient>(rootHandle, serverSlug!);

  return {
    serverSlug,
    serverState,
  };
};

export const ErrorBoundary = () => {
  return <p>Persistence provider error</p>;
};

const Layout = () => {
  const { serverState, serverSlug } = useLoaderData<typeof clientLoader>();

  const gameSyncWorkerRef = useRef<Worker | null>(null);

  const [queryClient] = useState<QueryClient>(
    new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: Number.POSITIVE_INFINITY,
          networkMode: 'always',
          staleTime: ({ queryKey }) => {
            if (queryKey.includes(nonPersistedCacheKey)) {
              return 5_000;
            }

            return Number.POSITIVE_INFINITY;
          },
          queryFn: () => {},
        },
        mutations: {
          networkMode: 'always',
        },
      },
    }),
  );

  const persistClient = debounce((client: PersistedClient) => {
    if (!gameSyncWorkerRef.current) {
      return;
    }

    gameSyncWorkerRef.current.postMessage({
      client,
      serverSlug,
    });
  }, 300);

  const persister: Persister = {
    persistClient,
    restoreClient: () => serverState,
    removeClient: () => {},
  };

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
      <PersisterAwaiter fallback={<Fallback />}>
        <Outlet />
      </PersisterAwaiter>
      <ReactQueryDevtools
        client={queryClient}
        initialIsOpen={false}
      />
    </PersistQueryClientProvider>
  );
};

export default Layout;
