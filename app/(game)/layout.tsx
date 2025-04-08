import { type Query, QueryClient } from '@tanstack/react-query';
import { type PersistedClient, type Persister, PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { getParsedFileContents, getRootHandle } from 'app/utils/opfs';
import { debounce } from 'moderndash';
import { useEffect, useRef, useState } from 'react';
import { heroCacheKey, nonPersistedCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet } from 'react-router';
import GameSyncWorker from './workers/sync-worker?worker&url';
import { PersisterAwaiter } from 'app/(game)/components/persister-awaiter';
import type { Route } from '.react-router/types/app/(game)/+types/layout';
import type { Hero } from 'app/interfaces/models/game/hero';
import { assignHeroModelPropertiesToUnitModel } from 'app/(game)/utils/hero';
import { MemoryIndicator } from 'app/(game)/components/memory-indicator';
import { isMasterDeploy } from 'app/utils/common';

const Fallback = () => {
  return <div>Loader...</div>;
};

// We're abusing client loader for checking whether server exists. If not, getFileHandle throws an error which triggers ErrorBoundary.
export const clientLoader = async ({ params }: Route.ClientLoaderArgs) => {
  const { serverSlug } = params;

  const rootHandle = await getRootHandle();
  await rootHandle.getFileHandle(`${serverSlug}.json`);
};

export const ErrorBoundary = () => {
  return <p>Persistence provider error</p>;
};

const Layout = ({ params }: Route.ComponentProps) => {
  const { serverSlug } = params;

  const gameSyncWorkerRef = useRef<Worker | null>(null);

  const [queryClient] = useState<QueryClient>(
    new QueryClient({
      defaultOptions: {
        queries: {
          // Non-persisted queries must have a gcTime set individually
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
    // Do not move this to clientLoader, otherwise a reference to serverState sticks in memory and adds a ton of overhead
    restoreClient: async () => {
      const rootHandle = await getRootHandle();
      const serverState = await getParsedFileContents<PersistedClient>(rootHandle, serverSlug!);
      return serverState;
    },
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

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(({ query }) => {
      if (query.queryHash === `["${heroCacheKey}"]`) {
        const hero: Hero = query.state.data;
        // This is extremely hacky, but the idea is to change the HERO unit data, which then makes it super convenient in other parts of the app
        assignHeroModelPropertiesToUnitModel(hero);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

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
      {!isMasterDeploy() && <MemoryIndicator />}
    </PersistQueryClientProvider>
  );
};

export default Layout;
