import { useTranslation } from 'react-i18next';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(reports)/+types/page';
import { ArchivedReports } from 'app/(game)/(village-slug)/(reports)/components/archived-reports';
import { CurrentVillageReports } from 'app/(game)/(village-slug)/(reports)/components/current-village-reports';
import { Reports } from 'app/(game)/(village-slug)/(reports)/components/reports';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const ReportsPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();

  const title = `${t('Reports')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="../resources">{t('Resources')}</BreadcrumbLink>
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
