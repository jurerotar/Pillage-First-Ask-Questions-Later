import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { BuildingStatsUpgradeCost } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/building-stats/components/building-stats-upgrade-cost';
import { BuildingStatsUpgradeDuration } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/building-stats/components/building-stats-upgrade-duration';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

export const BuildingStats = () => {
  const { t } = useTranslation();

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
      <Tabs>
        <TabList>
          <Tab>{t('Upgrade cost & benefits')}</Tab>
          <Tab>{t('Upgrade duration')}</Tab>
        </TabList>
        <TabPanel>
          <BuildingStatsUpgradeCost />
        </TabPanel>
        <TabPanel>
          <BuildingStatsUpgradeDuration />
        </TabPanel>
      </Tabs>
    </Section>
  );
};
