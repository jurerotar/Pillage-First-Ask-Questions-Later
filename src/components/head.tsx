import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';

type PublicPageName =
  | 'home';

type GamePageName =
  | 'resources'
  | 'village'
  | 'map';

type AppHelmetProps = {
  viewName: PublicPageName | GamePageName;
  children?: React.ReactNode;
};

export const Head: React.FC<AppHelmetProps> = (props) => {
  const {
    viewName,
    children
  } = props;

  const { t } = useTranslation();

  const title: string = t(`META.VIEWS.${viewName.toUpperCase()}.TITLE`);
  const description: string = t(`META.VIEWS.${viewName.toUpperCase()}.DESCRIPTION`);

  return (
    <Helmet>
      <title>
        {title}
      </title>
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
      {children}
    </Helmet>
  );
};
