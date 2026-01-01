import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { memo, Suspense, useEffect, useState } from 'react';
import {
  Link,
  Outlet,
  type ShouldRevalidateFunction,
  useRouteError,
} from 'react-router';
import { Toaster, type ToasterProps } from 'sonner';
import type { Route } from '@react-router/types/app/(game)/+types/layout';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { Notifier } from 'app/(game)/components/notifier';
import { serverExistAndLockMiddleware } from 'app/(game)/middleware/server-already-open-middleware';
import { ApiProvider } from 'app/(game)/providers/api-provider';
import { Skeleton } from 'app/components/ui/skeleton';
import { loadAppTranslations } from 'app/localization/loaders/app';

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

export const shouldRevalidate: ShouldRevalidateFunction = () => {
  return false;
};

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  serverExistAndLockMiddleware,
];

export const ErrorBoundary = () => {
  const routeErr = useRouteError();

  const now = new Date();

  const error = ((): { title: string; message: string; details: string } => {
    try {
      if (routeErr instanceof Error) {
        const stack = routeErr.stack ?? '';
        const details = JSON.stringify(
          {
            type: routeErr.name || 'Error',
            message: routeErr.message,
            stack: stack,
            time: now.toISOString(),
          },
          null,
          2,
        );
        return {
          title: routeErr.name || 'Unexpected Error',
          message: routeErr.message,
          details,
        };
      }

      const details = JSON.stringify(
        { value: routeErr, time: now.toISOString() },
        null,
        2,
      );
      return {
        title: 'Unknown error',
        message: 'An unexpected error occurred.',
        details,
      };
    } catch {
      return {
        title: 'Error',
        message: 'An unexpected error occurred.',
        details: '',
      };
    }
  })();

  const copyDetails = async () => {
    await navigator.clipboard?.writeText(error.details ?? '');
  };

  return (
    <main className="container mx-auto max-w-2xl p-4 flex flex-col gap-4">
      <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-900">
        <h1 className="text-lg font-semibold">{error.title}</h1>
        <p className="mt-1">
          {error.message ||
            'An error has occurred while initializing the game world.'}
        </p>
      </div>

      <p className="text-sm text-muted-foreground">Try these steps:</p>
      <ul className="list-disc pl-6 space-y-1 text-sm">
        <li>Refresh this page — transient issues often resolve on reload.</li>
        <li>
          If the error persists, export your game state from the{' '}
          <Link
            className="underline"
            to="/"
          >
            home page
          </Link>{' '}
          and report the issue via:{' '}
          <a
            className="underline"
            href="https://discord.gg/Ep7NKVXUZA"
            target="_blank"
            rel="noopener noreferrer"
          >
            #bugs on Discord
          </a>{' '}
          or{' '}
          <a
            className="underline"
            href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later/issues/new/choose"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Issues
          </a>
          .
        </li>
      </ul>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          Refresh page
        </button>
        <Link
          to="/"
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          Return to homepage
        </Link>
        <button
          type="button"
          onClick={copyDetails}
          className="ml-auto inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          title="Copy technical details to clipboard"
        >
          Copy details
        </button>
      </div>

      <details
        open
        className="rounded-md border bg-white p-3 text-sm"
      >
        <summary className="cursor-pointer select-none font-medium">
          Technical details
        </summary>
        <pre className="mt-2 overflow-auto rounded bg-gray-50 p-2 text-xs">
          {error.details}
        </pre>
      </details>
    </main>
  );
};

const LayoutFallback = () => {
  return (
    <>
      <div className="h-dvh w-full flex flex-col justify-between gap-2 lg:hidden ">
        <div className="flex flex-col p-2 pt-0 bg-linear-to-r from-gray-200 via-white to-gray-200">
          <div className="flex gap-6 w-full h-14 items-center">
            <Skeleton className="size-11.5 rounded-full!" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="size-11.5 rounded-full!" />
          </div>
          <Skeleton className="h-13" />
        </div>
        <Skeleton className="h-24 rounded-none!" />
      </div>
      <div className="hidden lg:flex flex-col justify-center relative">
        <Skeleton className="h-19 w-full rounded-none!" />
        <Skeleton className="h-16 w-xl mx-auto rounded-none! absolute top-27 absolute-centering" />
      </div>
    </>
  );
};

const Layout = memo<Route.ComponentProps>(
  ({ params, loaderData }) => {
    const { serverSlug } = params;
    const { sessionId } = loaderData;

    const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

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

    const toasterPosition: ToasterProps['position'] = isWiderThanLg
      ? 'bottom-right'
      : 'top-right';

    useEffect(() => {
      const { promise, resolve } = Promise.withResolvers();

      navigator.locks.request(`${serverSlug}:${sessionId}`, () => promise);

      return () => {
        resolve(null);
      };
    }, [serverSlug, sessionId]);

    return (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<LayoutFallback />}>
          <ApiProvider serverSlug={serverSlug}>
            <Outlet />
            <Notifier serverSlug={serverSlug} />
          </ApiProvider>
        </Suspense>
        <Toaster
          position={toasterPosition}
          closeButton
        />
      </QueryClientProvider>
    );
  },
  (prev, next) => {
    return prev.params.serverSlug === next.params.serverSlug;
  },
);

export default Layout;
