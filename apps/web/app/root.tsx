import { Links, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { initFaro } from 'app/faro';
import { StateProvider } from 'app/providers/state-provider';
import './localization/i18n';
import './styles/app.css';
import type { Route } from '@react-router/types/app/+types/root';
import { SqlitePrefetchLink } from 'app/components/sqlite-prefetch-link';
import { env } from 'app/env';
import { clientSessionMiddleware } from 'app/middleware/client-session-middleware';

await initFaro();

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  clientSessionMiddleware,
];

export const Layout = () => {
  return (
    <html lang="en-US">
      <head>
        {env.MODE === 'production' && (
          <>
            <link
              rel="manifest"
              href="/manifest.webmanifest"
            />
            <link
              rel="preconnect"
              href={env.VITE_FARO_INGEST_ENDPOINT}
              crossOrigin="anonymous"
            />
          </>
        )}
        <link
          rel="icon"
          type="image/png"
          href={`/favicon-96x96.png?v=${env.GRAPHICS_VERSION}`}
          sizes="96x96"
        />
        <link
          rel="shortcut icon"
          href={`/favicon.ico?v=${env.GRAPHICS_VERSION}`}
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={`/apple-touch-icon.png?v=${env.GRAPHICS_VERSION}`}
        />
        <meta
          name="apple-mobile-web-app-title"
          content="Pillage First!"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta
          name="description"
          content="Pillage First! (Ask Questions Later) is a single-player, real-time, browser-based strategy game inspired by Travian. Manage resources to construct buildings, train units, and wage war against your enemies. Remember: pillage first, ask questions later!"
        />
        <meta
          name="twitter:card"
          content="summary"
        />
        <meta
          property="og:url"
          content="https://pillagefirst.com"
        />
        <meta
          property="og:type"
          content="website"
        />
        <SqlitePrefetchLink />
        <Links />
      </head>
      <body>
        <StateProvider>
          <Outlet />
        </StateProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

const App = () => {
  return <Outlet />;
};

export default App;
