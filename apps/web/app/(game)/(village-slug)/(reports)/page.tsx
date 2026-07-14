import { useTranslation } from 'react-i18next';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(reports)/+types/page';
import { ArchivedReports } from 'app/(game)/(village-slug)/(reports)/components/archived-reports';
import { CurrentVillageReports } from 'app/(game)/(village-slug)/(reports)/components/current-village-reports';
import { Reports } from 'app/(game)/(village-slug)/(reports)/components/reports';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { PageContents } from 'app/components/page-contents';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const tabs = ['all', 'archived', 'village'];

const ReportsPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();

  const { tabIndex, navigateToTab } = useTabParam(tabs, 'reports-tab');

  const title = `${t('Reports')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <PageContents>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="../village">{t('Village')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Reports')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <InformationPopover
        ariaLabel={t('Reports')}
        className="top-2 right-2"
      >
        <Text>
          {t(
            'Review categorized in-game reports across all villages, archived reports and the current village.',
          )}
        </Text>
      </InformationPopover>
      <Text as="h1">{t('Reports')}</Text>
      <Tabs
        value={tabs[tabIndex] ?? tabs[0]}
        onValueChange={(value) => {
          navigateToTab(value);
        }}
      >
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
    </PageContents>
  );
};

export default ReportsPage;
