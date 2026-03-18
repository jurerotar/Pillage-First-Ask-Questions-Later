import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { memo, Suspense, use, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Links,
  Outlet,
  Scripts,
  ScrollRestoration,
  type ShouldRevalidateFunction,
} from 'react-router';
import type { ToasterProps } from 'sonner';
import type { Route } from '@react-router/types/app/(game)/+types/layout';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { ApiInvalidationSync } from 'app/(game)/components/api-invalidation-sync.tsx';
import { ApiTimeSync } from 'app/(game)/components/api-time-sync.tsx';
import { ApiWorkerBootstrap } from 'app/(game)/components/api-worker-bootstrap.tsx';
import { Notifier } from 'app/(game)/components/notifier';
import { serverExistAndLockMiddleware } from 'app/(game)/middleware/server-already-open-middleware';
import { ApiProvider } from 'app/(game)/providers/api-provider';
import { HeadLinks } from 'app/components/head-links.tsx';
import { Spinner } from 'app/components/ui/spinner';
import { Toaster } from 'app/components/ui/toaster';
import { loadAppTranslations } from 'app/localization/loaders/app';
import { CookieContext, CookieProvider } from 'app/providers/cookie-provider';

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
    <div className="h-dvh w-full flex items-center justify-center bg-background!">
      <Spinner size="large" />
    </div>
  );
};

const LayoutContent = memo<Route.ComponentProps>(
  ({ params, loaderData }) => {
    const { serverSlug } = params;
    const { sessionId } = loaderData;

    const { i18n } = useTranslation();
    const { uiColorScheme } = use(CookieContext);
    const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

    const [queryClient] = useState<QueryClient>(
      new QueryClient({
        defaultOptions: {
          queries: {
            networkMode: 'always',
            retry: false,
          },
          mutations: {
            networkMode: 'always',
            retry: false,
          },
        },
      }),
    );

    const toasterPosition: ToasterProps['position'] = isWiderThanLg
      ? 'bottom-right'
      : 'top-right';

    useEffect(() => {
      const { promise, resolve } = Promise.withResolvers();

      navigator.locks.request(
        `${serverSlug}:${sessionId}`,
        async () => promise,
      );

      return () => {
        resolve(null);
      };
    }, [serverSlug, sessionId]);

    return (
      <html
        lang={i18n.language}
        className={clsx(uiColorScheme)}
      >
        <head>
          <HeadLinks />
          <Links />
        </head>
        <body className="bg-background text-foreground transition-colors duration-300">
          <QueryClientProvider client={queryClient}>
            <Suspense fallback={<LayoutFallback />}>
              <ApiProvider serverSlug={serverSlug}>
                <ApiWorkerBootstrap>
                  <Outlet />
                  <ApiInvalidationSync />
                  <ApiTimeSync />
                  <Notifier serverSlug={serverSlug} />
                </ApiWorkerBootstrap>
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

const Layout = (props: Route.ComponentProps) => {
  return (
    <CookieProvider>
      <LayoutContent {...props} />
    </CookieProvider>
  );
};

export default Layout;
