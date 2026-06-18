import { faro } from '@grafana/faro-web-sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import type { Server } from '@pillage-first/types/models/server';
import type { Route } from '@react-router/types/app/(game)/+types/layout';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { Notifier } from 'app/(game)/components/notifier';
import { serverExistAndLockMiddleware } from 'app/(game)/middleware/server-already-open-middleware';
import { ApiProvider } from 'app/(game)/providers/api-provider';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';
import { HeadLinks } from 'app/components/head-links';
import { Spinner } from 'app/components/ui/spinner';
import { Toaster } from 'app/components/ui/toaster';
import { loadAppTranslations } from 'app/localization/loaders/app';
import { CookieContext, CookieProvider } from 'app/providers/cookie-provider';

export { ErrorBoundary } from 'app/(game)/error-boundary';

const addGameWorldAttributesToFaro = (serverSlug: string): void => {
  const getGameWorldListing = (): Server[] => {
    try {
      return JSON.parse(
        window.localStorage.getItem(availableServerCacheKey) ?? '[]',
      );
    } catch {
      return [];
    }
  };

  const gameWorld = getGameWorldListing().find(({ slug }) => {
    return slug === serverSlug;
  });

  if (!gameWorld) {
    return;
  }

  const session = faro.api.getSession();

  faro.api.setSession({
    ...session,
    attributes: {
      ...session?.attributes,
      gameWorld: JSON.stringify(gameWorld),
    },
  });
};

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

  addGameWorldAttributesToFaro(serverSlug);

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
      let release: (() => void) | undefined;

      navigator.locks.request(
        `${serverSlug}:${sessionId}`,
        () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
      );

      return () => {
        release?.();
      };
    }, [serverSlug, sessionId]);

    return (
      <html
        lang={i18n.language}
        className={uiColorScheme === 'dark' ? 'dark' : ''}
      >
        <head>
          <HeadLinks />
          <Links />
        </head>
        <body className="bg-background text-foreground transition-colors duration-300">
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

const Layout = (props: Route.ComponentProps) => {
  return (
    <CookieProvider>
      <LayoutContent {...props} />
    </CookieProvider>
  );
};

export default Layout;
