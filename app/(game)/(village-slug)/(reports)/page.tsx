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
      <Tabs defaultValue="all">
        <TabList>
          <Tab value="all">{t('All')}</Tab>
          <Tab value="archived">{t('Archived')}</Tab>
          <Tab value="village">{t('This village')}</Tab>
        </TabList>
        <TabPanel value="all">
          <Reports />
        </TabPanel>
        <TabPanel value="archived">
          <ArchivedReports />
        </TabPanel>
        <TabPanel value="village">
          <CurrentVillageReports />
        </TabPanel>
      </Tabs>
    </>
  );
};

export default ReportsPage;
