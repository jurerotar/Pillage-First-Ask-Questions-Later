import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { memo, Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Links,
  Outlet,
  Scripts,
  ScrollRestoration,
  type ShouldRevalidateFunction,
} from 'react-router';
import { Toaster, type ToasterProps } from 'sonner';
import type { Route } from '@react-router/types/app/(game)/+types/layout';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { Notifier } from 'app/(game)/components/notifier';
import { serverExistAndLockMiddleware } from 'app/(game)/middleware/server-already-open-middleware';
import { ApiProvider } from 'app/(game)/providers/api-provider';
import { HeadLinks } from 'app/components/head-links.tsx';
import { Skeleton } from 'app/components/ui/skeleton';
import { loadAppTranslations } from 'app/localization/loaders/app';

export { ErrorBoundary } from 'app/(game)/error-boundary.tsx';

export const clientLoader = async ({
  context,
  params,
}: Route.ClientLoaderArgs) => {
  const { serverSlug } = params;

  const locale = 'en-US';

  const [sessionModule] = await Promise.all([
    import('app/context/session'),
    loadAppTranslations(locale),
  ]);

  const { sessionContext } = sessionModule;
  const { sessionId } = context.get(sessionContext);

  return {
    sessionId,
    serverSlug,
  };
};

export const shouldRevalidate: ShouldRevalidateFunction = () => {
  return false;
};

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  serverExistAndLockMiddleware,
];

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

    const { i18n } = useTranslation();
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
      <html lang={i18n.language}>
        <head>
          <HeadLinks />
          <Links />
        </head>
        <body>
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
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    );
  },
  (prev, next) => {
    return prev.params.serverSlug === next.params.serverSlug;
  },
);

export default Layout;
