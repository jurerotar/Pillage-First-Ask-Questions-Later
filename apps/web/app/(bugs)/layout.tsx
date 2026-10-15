import {
  QueryClient,
  QueryClientProvider,
  useIsMutating,
  useQueryClient,
} from '@tanstack/react-query';
import { use, useEffect, useState } from 'react';
import { Link, Links, Outlet, Scripts, ScrollRestoration } from 'react-router';
import type { Route } from '@react-router/types/app/(bugs)/+types/layout';
import { closeAllApiWorkers } from 'app/(game)/providers/utils/api-worker-manager';
import { HeadLinks } from 'app/components/head-links';
import { Button } from 'app/components/ui/button';
import { CookieContext } from 'app/providers/cookie-context';
import { CookieProvider } from 'app/providers/cookie-provider';
import { SignInForm } from './components/sign-in-form';

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  closeAllApiWorkers,
];

const AUTH_TOKEN_STORAGE_KEY = 'bug-reporter-ui.auth-token';

const BugReporter = () => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    setToken(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? '');
  }, []);

  const isMutating = useIsMutating() > 0;

  return (
    <main className="mx-auto w-full max-w-270 px-3 py-5 sm:px-5 sm:py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold leading-tight">
          <Link to="/bugs">Bug reports</Link>
        </h1>
        {token && (
          <Button
            variant="outline"
            disabled={isMutating}
            onClick={() => {
              localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
              queryClient.clear();
              setToken('');
            }}
          >
            Sign out
          </Button>
        )}
      </header>
      {token ? (
        <Outlet context={token} />
      ) : (
        <SignInForm
          onSignIn={(token) => {
            localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
            setToken(token);
          }}
        />
      )}
    </main>
  );
};

const LayoutContent = () => {
  const { uiColorScheme } = use(CookieContext);
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return (
    <html
      lang="en-US"
      className={uiColorScheme}
    >
      <head>
        <meta charSet="utf-8" />
        <title>Bug reports | Pillage First!</title>
        <HeadLinks />
        <Links />
      </head>
      <body className="min-h-screen bg-background px-safe text-foreground transition-colors">
        <QueryClientProvider client={queryClient}>
          <BugReporter />
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

const BugsLayout = () => (
  <CookieProvider>
    <LayoutContent />
  </CookieProvider>
);

export default BugsLayout;
