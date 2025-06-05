import { useTranslation } from 'react-i18next';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from 'app/components/ui/breadcrumb';
import { Text } from 'app/components/text';
import type { MetaFunction } from 'react-router';
import { t } from 'i18next';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { Reports } from 'app/(game)/(village-slug)/(reports)/components/reports';
import { ArchivedReports } from 'app/(game)/(village-slug)/(reports)/components/archived-reports';
import { CurrentVillageReports } from 'app/(game)/(village-slug)/(reports)/components/current-village-reports';

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
      <Tabs>
        <TabList>
          <Tab>{t('All')}</Tab>
          <Tab>{t('Archived')}</Tab>
          <Tab>{t('This village')}</Tab>
        </TabList>
        <TabPanel>
          <Reports />
        </TabPanel>
        <TabPanel>
          <ArchivedReports />
        </TabPanel>
        <TabPanel>
          <CurrentVillageReports />
        </TabPanel>
      </Tabs>
    </>
  );
};

export default ReportsPage;
