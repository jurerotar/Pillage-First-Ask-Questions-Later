import { env } from '@pillage-first/utils/env';

const siteOrigin = 'https://pillagefirst.com';
const socialImageAlt = 'Pillage First! logo';

type PageMetadataProps = {
  title: string;
  description: string;
  pathname: string;
};

export const PageMetadata = ({
  title,
  description,
  pathname,
}: PageMetadataProps) => {
  const canonicalUrl = `${siteOrigin}${pathname}`;
  const socialImageUrl = `${siteOrigin}/pillage-first-logo.png?v=${env.GRAPHICS_VERSION}`;

  return (
    <>
      <title>{title}</title>
      <link
        rel="canonical"
        href={canonicalUrl}
      />
      <meta
        name="description"
        content={description}
      />
      <meta
        name="twitter:title"
        content={title}
      />
      <meta
        name="twitter:description"
        content={description}
      />
      <meta
        name="twitter:url"
        content={canonicalUrl}
      />
      <meta
        name="twitter:image"
        content={socialImageUrl}
      />
      <meta
        name="twitter:image:alt"
        content={socialImageAlt}
      />
      <meta
        property="og:title"
        content={title}
      />
      <meta
        property="og:description"
        content={description}
      />
      <meta
        property="og:url"
        content={canonicalUrl}
      />
      <meta
        property="og:image"
        content={socialImageUrl}
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
        property="og:image:alt"
        content={socialImageAlt}
      />
    </>
  );
};
