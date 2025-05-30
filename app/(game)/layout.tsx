import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, useEffect, useState } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, redirect, useLoaderData } from 'react-router';
import type { Route } from '.react-router/types/app/(game)/+types/layout';
import { Toaster } from 'app/components/ui/toaster';
import { loadAppTranslations } from 'app/localization/loaders/app';
import { ApiProvider } from 'app/(game)/providers/api-provider';

export const clientLoader = async ({ context }: Route.ClientLoaderArgs) => {
  const { sessionContext } = await import('app/context/session');

  await loadAppTranslations();

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
      throw redirect('/error/403');
    }
  }

  const root = await navigator.storage.getDirectory();
  const rootHandle = await root.getDirectoryHandle('pillage-first-ask-questions-later', { create: true });

  try {
    await rootHandle.getFileHandle(`${serverSlug}.json`);
  } catch (_error) {
    throw redirect('/error/404');
  }
};

export const unstable_clientMiddleware = [serverExistAndLockMiddleware];

const Layout = ({ params }: Route.ComponentProps) => {
  const { serverSlug } = params;

  const { sessionId } = useLoaderData<typeof clientLoader>();

  const [queryClient] = useState<QueryClient>(
    new QueryClient({
      defaultOptions: {
        queries: {},
        mutations: {
          networkMode: 'always',
        },
      },
    }),
  );

  useEffect(() => {
    const { promise, resolve } = Promise.withResolvers();

    navigator.locks.request(`${serverSlug}:${sessionId}`, () => promise);

    return () => {
      resolve(null);
    };
  }, [serverSlug, sessionId]);

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback="Api provider loader">
        <ApiProvider serverSlug={serverSlug!}>
          <Outlet />
        </ApiProvider>
      </Suspense>
      <ReactQueryDevtools
        client={queryClient}
        initialIsOpen={false}
      />
      <Toaster />
    </QueryClientProvider>
  );
};

export default Layout;
