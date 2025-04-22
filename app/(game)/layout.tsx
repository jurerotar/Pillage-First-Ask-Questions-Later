import { dehydrate, type Query, QueryClient } from '@tanstack/react-query';
import { type PersistedClient, type Persister, PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { getParsedFileContents, getRootHandle } from 'app/utils/opfs';
import { debounce } from 'moderndash';
import { useEffect, useState } from 'react';
import { heroCacheKey, nonPersistedCacheKey, playerVillagesCacheKey, questsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, redirect, useLoaderData } from 'react-router';
import { PersisterAwaiter } from 'app/(game)/components/persister-awaiter';
import type { Route } from '.react-router/types/app/(game)/+types/layout';
import type { Hero } from 'app/interfaces/models/game/hero';
import { assignHeroModelPropertiesToUnitModel } from 'app/(game)/utils/hero';
import { MemoryIndicator } from 'app/(game)/components/memory-indicator';
import { isMasterDeploy } from 'app/utils/common';
import { useWorkerRef } from 'app/(game)/hooks/use-worker-ref';
import GameSyncWorker from './workers/sync-worker?worker&url';
import QuestsWorker from './workers/quests-worker?worker&url';
import type { QuestsWorkerReturn } from './workers/quests-worker';
import type { Quest } from 'app/interfaces/models/game/quest';

const Fallback = () => {
  return <div>Loader...</div>;
};

export const clientLoader = async ({ context }: Route.ClientLoaderArgs) => {
  const { sessionContext } = await import('app/context/session');

  const { sessionId } = context.get(sessionContext);

  return {
    sessionId,
  };
};

// Check whether server even exists && whether server is already opened in another tab
const serverExistAndLockMiddleware: Route.unstable_ClientMiddlewareFunction = async ({ context, params }) => {
  const { sessionContext } = await import('app/context/session');

  const { serverSlug } = params;

  const { sessionId } = context.get(sessionContext);

  const lockManager = await window.navigator.locks.query();

  // Check if there exists a lock with server slug. If yes, we check if current sessionId matches.
  // If it doesn't, it means the same server was opened in a different tab
  const lock = lockManager.held!.find((lock) => lock?.name?.startsWith(serverSlug!));

  if (lock) {
    const [, lockSessionId] = lock.name!.split(':');

    if (lockSessionId !== sessionId) {
      throw redirect('/error?error-id=403');
    }
  }

  const root = await navigator.storage.getDirectory();
  const rootHandle = await root.getDirectoryHandle('pillage-first-ask-questions-later', { create: true });

  try {
    await rootHandle.getFileHandle(`${serverSlug}.json`);
  } catch (_error) {
    throw redirect('/error?error-id=404');
  }
};

export const unstable_clientMiddleware = [serverExistAndLockMiddleware];

const Layout = ({ params }: Route.ComponentProps) => {
  const { serverSlug } = params;

  const { sessionId } = useLoaderData<typeof clientLoader>();

  const gameSyncWorkerRef = useWorkerRef(GameSyncWorker);
  const questWorkerRef = useWorkerRef(QuestsWorker);

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
          queryFn: () => {
          },
        },
        mutations: {
          networkMode: 'always',
        },
      },
    }),
  );

  // TODO: Figure out if there's a way to limit on which changes query client persists
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
    removeClient: () => {
    },
  };

  useEffect(() => {
    if (!questWorkerRef.current) {
      return;
    }

    const eventHandler = async (event: MessageEvent<QuestsWorkerReturn>) => {
      queryClient.setQueryData<Quest[]>([questsCacheKey], () => {
        return event.data.resolvedQuests;
      });
    }

    questWorkerRef.current.addEventListener('message', eventHandler);

    return () => {
      if (questWorkerRef.current) {
        questWorkerRef.current.removeEventListener('message', eventHandler)
      }
    };
  }, [questWorkerRef, queryClient]);

  useEffect(() => {
    const { promise, resolve } = Promise.withResolvers();

    navigator.locks.request(`${serverSlug}:${sessionId}`, () => promise);

    return () => {
      resolve(null);
    };
  }, [serverSlug, sessionId]);

  useEffect(() => {
    const heroQueryHash = `["${heroCacheKey}"]`;
    const hashesThatTriggerQuestValidation = [`["${playerVillagesCacheKey}"]`];

    const unsubscribe = queryClient.getQueryCache().subscribe(({ query, type }) => {
      if (type !== 'updated') {
        return;
      }

      if (query.queryHash === heroQueryHash) {
        const hero: Hero = query.state.data;
        // This is extremely hacky, but the idea is to change the HERO unit data in runtime, which then makes it super convenient in other parts of the app
        assignHeroModelPropertiesToUnitModel(hero);
      }

      if (questWorkerRef.current) {
        if (hashesThatTriggerQuestValidation.includes(query.queryHash)) {

          const dehydratedState = dehydrate(queryClient);
          questWorkerRef.current.postMessage({
            dehydratedState,
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, questWorkerRef]);

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
