import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';

type AppHelmetProps = {
  viewName: 'home' | 'resources' | 'village' | 'map';
};

const AppHelmet: React.FC<AppHelmetProps> = (props): JSX.Element => {
  const {
    viewName
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
    </Helmet>
  );
};

export default AppHelmet;
