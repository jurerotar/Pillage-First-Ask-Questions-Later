import { useTranslation } from 'react-i18next';
import { WarningAlert } from 'app/components/alert';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from 'app/components/ui/breadcrumb';
import { Text } from 'app/components/text';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';

const OverviewPage = () => {
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
          <BreadcrumbItem>{t('Village overview')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">{t('Village overview')}</Text>
      <WarningAlert>{t('This page is still under development')}</WarningAlert>
    </>
  );
};

export default OverviewPage;
