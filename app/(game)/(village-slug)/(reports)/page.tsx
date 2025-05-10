import { Alert } from 'app/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from 'app/components/ui/breadcrumb';
import { Text } from 'app/components/text';
import type { MetaFunction } from 'react-router';
import { t } from 'i18next';

export const meta: MetaFunction = ({ params }) => {
  const { serverSlug, villageSlug } = params;

  return [
    {
      title: `${t('Reports')} | Pillage First! - ${serverSlug} - ${villageSlug}`,
    },
  ];
};

const ReportsPage = () => {
  const { t } = useTranslation();
  const { resourcesPath } = useGameNavigation();

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to={resourcesPath}>{t('Resources')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Reports')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">{t('Reports')}</Text>
      <Alert variant="warning">{t('This page is still under development')}</Alert>
    </>
  );
};

export default ReportsPage;
