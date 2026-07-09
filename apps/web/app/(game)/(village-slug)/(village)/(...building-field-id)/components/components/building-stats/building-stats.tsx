import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { BuildingStatsUpgradeBenefits } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/building-stats/components/building-stats-upgrade-benefits';
import { BuildingStatsUpgradeCost } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/building-stats/components/building-stats-upgrade-cost';
import { BuildingStatsUpgradeDuration } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/building-stats/components/building-stats-upgrade-duration';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const tabs = ['upgrade-cost', 'upgrade-benefits', 'upgrade-duration'];

export const BuildingStats = () => {
  const { t } = useTranslation();
  const { tabIndex, navigateToTab } = useTabParam(tabs, 'building-stats-tab');

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="upgrade-cost" />
        <InformationPopover ariaLabel={t('Upgrade details')}>
          <Text>
            {t(
              'This section provides detailed information about building upgrades, including the resource costs and the time required to reach each level. Use the tabs below to explore how upgrades impact both your economy and strategy.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Upgrade details')}</Text>
      </SectionContent>
      <SectionContent>
        <Tabs
          value={tabs[tabIndex] ?? tabs[0]}
          onValueChange={(value) => {
            navigateToTab(value);
          }}
        >
          <TabList>
            <Tab value="upgrade-cost">{t('Upgrade cost')}</Tab>
            <Tab value="upgrade-benefits">{t('Upgrade benefits')}</Tab>
            <Tab value="upgrade-duration">{t('Upgrade duration')}</Tab>
          </TabList>
          <TabPanel value="upgrade-cost">
            <BuildingStatsUpgradeCost />
          </TabPanel>
          <TabPanel value="upgrade-benefits">
            <BuildingStatsUpgradeBenefits />
          </TabPanel>
          <TabPanel value="upgrade-duration">
            <BuildingStatsUpgradeDuration />
          </TabPanel>
        </Tabs>
      </SectionContent>
    </Section>
  );
};
