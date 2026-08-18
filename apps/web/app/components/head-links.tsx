import { useTranslation } from 'react-i18next';
import { env } from '@pillage-first/utils/env';

export const HeadLinks = () => {
  const { i18n } = useTranslation();

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
      <meta
        name="twitter:card"
        content="summary_large_image"
      />
      <meta
        name="twitter:site"
        content="@pillagefirst"
      />
      <meta
        name="twitter:creator"
        content="@pillagefirst"
      />
      <meta
        property="og:type"
        content="website"
      />
      <meta
        property="og:locale"
        content={i18n.language.replace('-', '_')}
      />
      <meta
        property="og:site_name"
        content="Pillage First!"
      />
      <link
        rel="icon"
        type="image/png"
        href={`/favicon/favicon-96x96.png?v=${env.GRAPHICS_VERSION}`}
        sizes="96x96"
      />
      <link
        rel="shortcut icon"
        href={`/favicon/favicon.ico?v=${env.GRAPHICS_VERSION}`}
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href={`/favicon/apple-touch-icon.png?v=${env.GRAPHICS_VERSION}`}
      />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, viewport-fit=cover"
      />
      <meta
        name="apple-mobile-web-app-title"
        content="Pillage First!"
      />
    </>
  );
};
