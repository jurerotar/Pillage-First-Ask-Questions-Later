import { Links, Meta, type MetaFunction, Outlet, Scripts, ScrollRestoration } from 'react-router';
import './styles/styles.scss';
import './i18n';
import { StrictMode } from 'react';
import { ViewportProvider } from 'app/providers/viewport-context';
import { StateProvider } from 'app/providers/state-provider';

export const meta: MetaFunction = () => [{ title: 'Pillage First! (Ask Questions Later)' }];

export const Layout = () => {
  return (
    <html
      lang="en-US"
      className="default-theme"
    >
      <head>
        <link
          rel="icon"
          href="/logo.svg"
          type="image/svg+xml"
        />
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
          href="/logo-192.png"
        />
        <link
          rel="manifest"
          href="/manifest.webmanifest"
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
        <Meta />
        <Links />
      </head>
      <body>
        <StrictMode>
          <ViewportProvider>
            <StateProvider>
              <Outlet />
            </StateProvider>
          </ViewportProvider>
        </StrictMode>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

const Root = () => {
  return <Outlet />;
};

export default Root;
