import { useTranslation } from 'react-i18next';
import { env } from '@pillage-first/utils/env';
import { SqlitePrefetchLink } from 'app/components/sqlite-prefetch-link.tsx';

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
        name="description"
        content="Pillage First! (Ask Questions Later) is an open-source, single-player, strategy game inspired by Travian. Build villages, manage resources, train troops, start adventures and wage war in persistent, offline-first game worlds."
      />
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
        name="twitter:title"
        content="Pillage First! (Ask Questions Later)"
      />
      <meta
        name="twitter:description"
        content="Pillage First! (Ask Questions Later) is an open-source, single-player, strategy game inspired by Travian. Build villages, manage resources, train troops, start adventures and wage war in persistent, offline-first game worlds."
      />
      <meta
        name="twitter:image"
        content={`${env.DEPLOY_PRIME_URL}/pillage-first-logo.png?v=${env.GRAPHICS_VERSION}`}
      />
      <meta
        name="twitter:url"
        content={env.DEPLOY_PRIME_URL}
      />
      <meta
        property="og:url"
        content={env.DEPLOY_PRIME_URL}
      />
      <meta
        property="og:type"
        content="website"
      />
      <meta
        property="og:title"
        content="Pillage First! (Ask Questions Later)"
      />
      <meta
        property="og:description"
        content="Pillage First! (Ask Questions Later) is an open-source, single-player, strategy game inspired by Travian. Build villages, manage resources, train troops, start adventures and wage war in persistent, offline-first game worlds."
      />
      <meta
        property="og:image"
        content={`${env.DEPLOY_PRIME_URL}/pillage-first-logo.png?v=${env.GRAPHICS_VERSION}`}
      />
      <meta
        property="og:image:width"
        content="920"
      />
      <meta
        property="og:image:height"
        content="919"
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
      <SqlitePrefetchLink />
    </>
  );
};
