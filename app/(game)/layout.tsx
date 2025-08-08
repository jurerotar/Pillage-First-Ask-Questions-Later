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
import { Skeleton } from 'app/components/ui/skeleton';

export const clientLoader = async ({ context }: Route.ClientLoaderArgs) => {
  const { sessionContext } = await import('app/context/session');
  // const locale = await getCookie('locale', 'en-US');
  const locale = 'en-US';

  await loadAppTranslations(locale);

  const { sessionId } = context.get(sessionContext);

  return {
    sessionId,
  };
};

clientLoader.hydrate = true;

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

const LayoutFallback = () => {
  return (
    <>
      <div className="h-dvh w-full flex flex-col justify-between gap-2 lg:hidden ">
        <div className="flex flex-col p-2 pt-0 bg-gradient-to-r from-gray-200 via-white to-gray-200">
          <div className="flex gap-6 w-full h-14 items-center">
            <Skeleton className="size-11.5 !rounded-full" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="size-11.5 !rounded-full" />
          </div>
          <Skeleton className="h-13" />
        </div>
        <Skeleton className="h-24 !rounded-none" />
      </div>
      <div className="hidden lg:flex flex-col justify-center relative">
        <Skeleton className="h-19 w-full !rounded-none" />
        <Skeleton className="h-16 w-144 mx-auto !rounded-none absolute top-27 absolute-centering" />
      </div>
    </>
  );
};

const Layout = ({ params }: Route.ComponentProps) => {
  const { serverSlug } = params;

  const loaderData = useLoaderData<typeof clientLoader>();
  const sessionId = loaderData?.sessionId ?? null;

  const [queryClient] = useState<QueryClient>(
    new QueryClient({
      defaultOptions: {
        queries: {
          networkMode: 'always',
        },
        mutations: {
          networkMode: 'always',
        },
      },
    }),
  );

  useEffect(() => {
    if (sessionId === null) {
      return;
    }

    const { promise, resolve } = Promise.withResolvers();

    navigator.locks.request(`${serverSlug}:${sessionId}`, () => promise);

    return () => {
      resolve(null);
    };
  }, [serverSlug, sessionId]);

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<LayoutFallback />}>
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
