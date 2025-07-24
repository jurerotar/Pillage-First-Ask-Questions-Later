import type { Route } from '.react-router/types/app/(game)/+types/layout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ApiProvider } from 'app/(game)/providers/api-provider';
import { loadAppTranslations } from 'app/localization/loaders/app';
import { Suspense, useEffect, useState } from 'react';
import {
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useRouteError,
} from 'react-router';
import { Notifier } from 'app/(game)/components/notifier';

export const clientLoader = async ({ context }: Route.ClientLoaderArgs) => {
  const { sessionContext } = await import('app/context/session');

  await loadAppTranslations();

  const { sessionId } = context.get(sessionContext);

  return {
    sessionId,
  };
};

// Check whether server even exists && whether server is already opened in another tab
const serverExistAndLockMiddleware: Route.unstable_ClientMiddlewareFunction =
  async ({ context, params }) => {
    const { sessionContext } = await import('app/context/session');

    const { serverSlug } = params;

    const { sessionId } = context.get(sessionContext);

    const lockManager = await window.navigator.locks.query();

    // Check if there exists a lock with server slug. If yes, we check if current sessionId matches.
    // If it doesn't, it means the same server was opened in a different tab
    const lock = lockManager.held!.find((lock) =>
      lock?.name?.startsWith(serverSlug!),
    );

    if (lock) {
      const [, lockSessionId] = lock.name!.split(':');

      if (lockSessionId !== sessionId) {
        throw redirect('/error/403');
      }
    }

    const root = await navigator.storage.getDirectory();
    const rootHandle = await root.getDirectoryHandle(
      'pillage-first-ask-questions-later',
      {
        create: true,
      },
    );

    try {
      await rootHandle.getFileHandle(`${serverSlug}.json`);
    } catch (_error) {
      throw redirect('/error/404');
    }
  };

export const unstable_clientMiddleware = [serverExistAndLockMiddleware];

export const ErrorBoundary = () => {
  const err = useRouteError();
  const error = err as Error;

  return (
    <main className="container mx-auto max-w-lg p-2 flex flex-col gap-4">
      <p>
        An error has occurred while initializing the game world. The error was
        logged. You can try to refresh this page. If the error persists after
        refreshing, please export the game state of this world through the{' '}
        <Link
          className="underline"
          to="/"
        >
          home page
        </Link>{' '}
        and report the issue in the{' '}
        <a
          className="underline"
          href="https://discord.gg/Ep7NKVXUZA"
          target="_blank"
          rel="noopener noreferrer"
        >
          #bugs channel on Discord
        </a>{' '}
        or raise a{' '}
        <a
          className="underline"
          href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later/issues/new/choose"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub issue
        </a>
        .
      </p>
      <div className="flex flex-col gap-2">
        <p>Error description:</p>
        <pre>{error.message}</pre>
      </div>
    </main>
  );
};

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
        <ApiProvider>
          <Outlet />
          <Notifier />
        </ApiProvider>
      </Suspense>
      <ReactQueryDevtools
        client={queryClient}
        initialIsOpen={false}
      />
    </QueryClientProvider>
  );
};

export default Layout;
