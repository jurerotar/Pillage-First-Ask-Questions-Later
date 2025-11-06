import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Text } from 'app/components/text';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(statistics)/+types/page';
import { PopulationRankings } from 'app/(game)/(village-slug)/(statistics)/components/population-rankings';
import { VillageRankings } from 'app/(game)/(village-slug)/(statistics)/components/village-rankings';

const StatisticsPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();

  const tabs = ['default', 'villages'];

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  const title = `${t('Statistics')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="../village">{t('Village')}</BreadcrumbLink>
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
          <Tab>{t('Population')}</Tab>
          <Tab>{t('Villages')}</Tab>
        </TabList>
        <TabPanel>
          <PopulationRankings />
        </TabPanel>
        <TabPanel>
          <VillageRankings />
        </TabPanel>
      </Tabs>
    </>
  );
};

export default StatisticsPage;
