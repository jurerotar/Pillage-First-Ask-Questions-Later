import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { BuildingStatsUpgradeCost } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/building-stats/components/building-stats-upgrade-cost';
import { BuildingStatsUpgradeDuration } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/building-stats/components/building-stats-upgrade-duration';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const tabs = ['upgrade-cost-benefits', 'upgrade-duration'];

export const BuildingStats = () => {
  const { t } = useTranslation();
  const { tabIndex, navigateToTab } = useTabParam(tabs, 'building-stats-tab');

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="upgrade-cost" />
        <Text as="h2">{t('Upgrade details')}</Text>
        <Text>
          {t(
            'This section provides detailed information about building upgrades, including the resource costs and the time required to reach each level. Use the tabs below to explore how upgrades impact both your economy and strategy.',
          )}
        </Text>
      </SectionContent>
      <Tabs
        value={tabs[tabIndex] ?? tabs[0]}
        onValueChange={(value) => {
          navigateToTab(value);
        }}
      >
        <TabList>
          <Tab value="upgrade-cost-benefits">
            {t('Upgrade cost & benefits')}
          </Tab>
          <Tab value="upgrade-duration">{t('Upgrade duration')}</Tab>
        </TabList>
        <TabPanel value="upgrade-cost-benefits">
          <BuildingStatsUpgradeCost />
        </TabPanel>
        <TabPanel value="upgrade-duration">
          <BuildingStatsUpgradeDuration />
        </TabPanel>
      </Tabs>
    </Section>
  );
};
