import { Links, Outlet, Scripts } from 'react-router';
import { StateProvider } from 'app/providers/state-provider';
import clsx from 'clsx';
import type { Route } from '.react-router/types/app/+types/root';
import { initFaro } from './faro';
import './localization/i18n';
import './styles/app.css';
import { Toaster, type ToasterProps } from 'sonner';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';

await initFaro();

const isDeployingToMaster = import.meta.env.BRANCH_ENV === 'master';
const appIconPostfix = clsx(!isDeployingToMaster && '-dev');

const clientSessionMiddleware: Route.unstable_ClientMiddlewareFunction =
  async ({ context }) => {
    const { sessionContext } = await import('app/context/session');

    const sessionCtx = context.get(sessionContext);
    if (!sessionCtx.sessionId) {
      sessionCtx.sessionId = window.crypto.randomUUID();
    }
  };

export const unstable_clientMiddleware = [clientSessionMiddleware];

export const Layout = () => {
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

  const toasterPosition: ToasterProps['position'] = isWiderThanLg
    ? 'bottom-right'
    : 'top-right';

  return (
    <html lang="en-US">
      <head>
        <link
          rel="icon"
          href={`/logo${appIconPostfix}.svg`}
          type="image/svg+xml"
        />
        {import.meta.env.MODE === 'production' && (
          <>
            <link
              rel="manifest"
              href="/manifest.webmanifest"
            />
            <link
              rel="preconnect"
              href={import.meta.env.VITE_FARO_INGEST_ENDPOINT}
              crossOrigin="anonymous"
            />
          </>
        )}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <meta
          name="theme-color"
          content="#111111"
        />
        <meta
          name="description"
          content="Pillage First! (Ask Questions Later) is a single-player, real-time, browser-based strategy game inspired by Travian. Manage resources to construct buildings, train units, and wage war against your enemies. Remember: pillage first, ask questions later!"
        />
        <link
          rel="apple-touch-icon"
          href={`/logo${appIconPostfix}-192.png`}
        />
        <meta
          name="twitter:card"
          content="summary"
        />
        <meta
          property="og:url"
          content=""
        />
        <meta
          property="og:type"
          content="website"
        />
        <meta
          name="twitter:image"
          content="/images/"
        />
        <meta
          property="og:image"
          content="/images/"
        />
        <meta
          property="og:image:secure_url"
          content="/images/"
        />
        <meta
          property="og:image:type"
          content="image/png"
        />
        <meta
          property="og:image:width"
          content="1200"
        />
        <meta
          property="og:image:height"
          content="630"
        />
        <meta
          property="og:image:alt"
          content="Pillage First! (Ask Questions Later) is a single-player, real-time, browser-based strategy game inspired by Travian. Manage resources to construct buildings, train units, and wage war against your enemies. Remember: pillage first, ask questions later!"
        />
        <Links />
      </head>
      <body>
        <StateProvider>
          <Outlet />
        </StateProvider>
        <Toaster
          position={toasterPosition}
          closeButton
        />
        <Scripts />
      </body>
    </html>
  );
};

const App = () => {
  return <Outlet />;
};

export default App;
