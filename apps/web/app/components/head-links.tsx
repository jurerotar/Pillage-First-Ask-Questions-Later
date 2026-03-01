import { env } from '@pillage-first/utils/env';
import { SqlitePrefetchLink } from 'app/components/sqlite-prefetch-link.tsx';

export const HeadLinks = () => {
  return (
    <>
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
        name="viewport"
        content="width=device-width, initial-scale=1, viewport-fit=cover"
      />
      <meta
        name="apple-mobile-web-app-title"
        content="Pillage First!"
      />
      <SqlitePrefetchLink />
    </>
  );
};
