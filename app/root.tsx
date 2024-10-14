import React from 'react';
import { ViewportProvider } from 'app/providers/viewport-context';
import { StateProvider } from 'app/providers/state-provider';
import { Links, Meta, type MetaFunction, Outlet, Scripts, ScrollRestoration } from 'react-router';
import './styles/styles.scss';
import './i18n';

export const meta: MetaFunction = () => [
  { title: 'Pillage First! (Ask Questions Later)' },
];

const Root = () => {
  return (
    <html
      lang="en-US"
      className="default-theme"
    >
    <head>
      <meta charSet="utf-8" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
      />
      <link
        rel="icon"
        href="/favicon.ico"
        sizes="32x32"
      />
      <link
        rel="icon"
        href="/icon.svg"
        type="image/svg+xml"
      />
      <link
        rel="apple-touch-icon"
        href="/icon-192.png"
      />
      <link
        rel="manifest"
        href="/manifest.webmanifest"
      />
      <meta media="(prefers-color-scheme: light)" name="theme-color" content="#FFFFFF" />
      <meta media="(prefers-color-scheme: dark)" name="theme-color" content="#000000" />
      <meta
        name="description"
        content="Pillage First! (Ask Questions Later) is a single-player, real-time, browser-based strategy game inspired by Travian. Manage resources to construct buildings, train units, and wage war against your enemies. Remember: pillage first, ask questions later! ⚔️🔥"
      />
      <meta
        name="twitter:card"
        content="summary"
      />
      {/* TODO: Add site & creator */}
      <meta
        name="twitter:site"
        content="/"
      />
      <meta
        name="twitter:creator"
        content="/"
      />
      <meta
        name="og:description"
        content="Pillage First! (Ask Questions Later) is a single-player, real-time, browser-based strategy game inspired by Travian. Manage resources to construct buildings, train units, and wage war against your enemies. Remember: pillage first, ask questions later! ⚔️🔥"
      />
      <meta
        name="og:title"
        content="Pillage First! (Ask Questions Later)"
      />
      <meta
        property="og:url"
        content="https://pillagefirst.com"
      />
      <meta
        property="og:type"
        content="website"
      />
      <meta
        property="og:image"
        content="https://pillagefirst.com/images/"
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
        content="Pillage First! (Ask Questions Later) ⚔️🔥"
      />
      <Meta />
      <Links />
    </head>
    <body>
    <React.StrictMode>
      <ViewportProvider>
        <StateProvider>
          <Outlet />
        </StateProvider>
      </ViewportProvider>
    </React.StrictMode>
    <ScrollRestoration />
    <Scripts />
    </body>
    </html>
  );
};

export default Root;
