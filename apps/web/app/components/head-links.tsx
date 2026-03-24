import { useTranslation } from 'react-i18next';
import { env } from '@pillage-first/utils/env';
import { SqlitePrefetchLink } from 'app/components/sqlite-prefetch-link.tsx';
import { i18n } from 'app/localization/i18n.ts';

export const HeadLinks = () => {
  const { t } = useTranslation();

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
        content={t(
          'Pillage First! (Ask Questions Later) is a single-player, real-time, browser-based strategy game inspired by Travian. Manage resources to construct buildings, train units, and wage war against your enemies. Remember: pillage first, ask questions later!',
        )}
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
        content={t(
          'Pillage First! (Ask Questions Later) is a single-player, real-time, browser-based strategy game inspired by Travian. Manage resources to construct buildings, train units, and wage war against your enemies. Remember: pillage first, ask questions later!',
        )}
      />
      <meta
        name="twitter:image"
        content={`https://pillagefirst.com/pillage-first-logo.png?v=${env.GRAPHICS_VERSION}`}
      />
      <meta
        name="twitter:url"
        content="https://pillagefirst.com"
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
        property="og:title"
        content="Pillage First! (Ask Questions Later)"
      />
      <meta
        property="og:description"
        content={t(
          'Pillage First! (Ask Questions Later) is a single-player, real-time, browser-based strategy game inspired by Travian. Manage resources to construct buildings, train units, and wage war against your enemies. Remember: pillage first, ask questions later!',
        )}
      />
      <meta
        property="og:image"
        content={`https://pillagefirst.com/pillage-first-logo.png?v=${env.GRAPHICS_VERSION}`}
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
