import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(statistics)/+types/page';
import { PopulationRankings } from 'app/(game)/(village-slug)/(statistics)/components/population-rankings';
import { VillageRankings } from 'app/(game)/(village-slug)/(statistics)/components/village-rankings';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { PageContents } from 'app/components/page-contents';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const tabs = ['population', 'villages', 'production-and-power', 'overview'];

const GameWorldOverview = lazy(async () => ({
  default: (await import('./components/game-world-overview')).GameWorldOverview,
}));

const ProductionAndPowerComparison = lazy(async () => ({
  default: (await import('./components/production-and-power-comparison'))
    .ProductionAndPowerComparison,
}));

const StatisticsPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  const title = `${t('Statistics')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <PageContents>
      <title>{title}</title>
      <InformationPopover
        ariaLabel={t('Statistics')}
        className="top-2 right-2"
      >
        <Text>
          {t(
            'Review player rankings, village rankings, production, power and game world overview statistics.',
          )}
        </Text>
      </InformationPopover>
      <Text as="h1">{t('Statistics')}</Text>
      <Tabs
        value={tabs[tabIndex] ?? 'population'}
        onValueChange={(value) => {
          navigateToTab(value);
        }}
      >
        <TabList>
          <Tab value="population">{t('Population')}</Tab>
          <Tab value="villages">{t('Villages')}</Tab>
          <Tab value="production-and-power">{t('Production and power')}</Tab>
          <Tab value="overview">{t('Overview')}</Tab>
        </TabList>
        <TabPanel value="population">
          <PopulationRankings />
        </TabPanel>
        <TabPanel value="villages">
          <VillageRankings />
        </TabPanel>
        <TabPanel value="production-and-power">
          <Suspense fallback={null}>
            <ProductionAndPowerComparison />
          </Suspense>
        </TabPanel>
        <TabPanel value="overview">
          <Suspense fallback={null}>
            <GameWorldOverview />
          </Suspense>
        </TabPanel>
      </Tabs>
    </PageContents>
  );
};

export default StatisticsPage;
