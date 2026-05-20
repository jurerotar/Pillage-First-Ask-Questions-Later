type PageMetadataProps = {
  title: string;
  description: string;
};

export const PageMetadata = ({ title, description }: PageMetadataProps) => {
  return (
    <>
      <title>{title}</title>
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
        property="og:title"
        content={title}
      />
      <meta
        property="og:description"
        content={description}
      />
    </>
  );
};
