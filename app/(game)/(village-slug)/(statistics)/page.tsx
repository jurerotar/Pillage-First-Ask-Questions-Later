import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Text } from 'app/components/text';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(statistics)/+types/page';

const StatisticsPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();

  const tabs = ['default', 'villages', 'week-by-week'];

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  const title = `${t('Statistics')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="../resources">{t('Resources')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Statistics')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">{t('Statistics')}</Text>
      <Tabs
        selectedIndex={tabIndex}
        onSelect={(index) => {
          navigateToTab(tabs[index]);
        }}
      >
        <TabList>
          <Tab>{t('Overview')}</Tab>
          <Tab>{t('Villages')}</Tab>
          <Tab>{t('Week by week')}</Tab>
        </TabList>
        <TabPanel>
          <Alert variant="warning">
            {t('This page is still under development')}
          </Alert>
        </TabPanel>
        <TabPanel>
          <Alert variant="warning">
            {t('This page is still under development')}
          </Alert>
        </TabPanel>
        <TabPanel>
          <Alert variant="warning">
            {t('This page is still under development')}
          </Alert>
        </TabPanel>
      </Tabs>
    </>
  );
};

export default StatisticsPage;
