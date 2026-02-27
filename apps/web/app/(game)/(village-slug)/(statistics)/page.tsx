import { useTranslation } from 'react-i18next';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(statistics)/+types/page';
import { GameWorldOverview } from 'app/(game)/(village-slug)/(statistics)/components/game-world-overview';
import { PopulationRankings } from 'app/(game)/(village-slug)/(statistics)/components/population-rankings';
import { VillageRankings } from 'app/(game)/(village-slug)/(statistics)/components/village-rankings';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const tabs = ['population', 'villages', 'overview'];

const StatisticsPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();

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
        value={tabs[tabIndex] ?? 'population'}
        onValueChange={(value: string) => {
          navigateToTab(value);
        }}
      >
        <TabList>
          <Tab value="population">{t('Population')}</Tab>
          <Tab value="villages">{t('Villages')}</Tab>
          <Tab value="overview">{t('Overview')}</Tab>
        </TabList>
        <TabPanel value="population">
          <PopulationRankings />
        </TabPanel>
        <TabPanel value="villages">
          <VillageRankings />
        </TabPanel>
        <TabPanel value="overview">
          <GameWorldOverview />
        </TabPanel>
      </Tabs>
    </>
  );
};

export default StatisticsPage;
