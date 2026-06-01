import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark.tsx';
import { RallyPointReinforcementsTab } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/rally-point/components/stationed-troops/rally-point-reinforcements-tab';
import { RallyPointSentReinforcementsTab } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/rally-point/components/stationed-troops/rally-point-sent-reinforcements-tab';
import { RallyPointStationedTroopsTab } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/rally-point/components/stationed-troops/rally-point-stationed-troops-tab';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const tabs = ['stationed-troops', 'reinforcements', 'sent-reinforcements'];

export const RallyPointStationedTroops = () => {
  const { t } = useTranslation();
  const { tabIndex, navigateToTab } = useTabParam(
    tabs,
    'rally-point-stationed-troops-tab',
  );

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="stationed-troops" />
        <Text as="h2">{t('Stationed troops')}</Text>
        <Text>
          {t(
            'Troops stationed in this village, either as deployable troops or as reinforcements.',
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
          <Tab value="stationed-troops">{t('Stationed troops')}</Tab>
          <Tab value="reinforcements">{t('Reinforcements')}</Tab>
          <Tab value="sent-reinforcements">{t('Sent reinforcements')}</Tab>
        </TabList>
        <TabPanel value="stationed-troops">
          <RallyPointStationedTroopsTab />
        </TabPanel>
        <TabPanel value="reinforcements">
          <RallyPointReinforcementsTab />
        </TabPanel>
        <TabPanel value="sent-reinforcements">
          <RallyPointSentReinforcementsTab />
        </TabPanel>
      </Tabs>
    </Section>
  );
};
