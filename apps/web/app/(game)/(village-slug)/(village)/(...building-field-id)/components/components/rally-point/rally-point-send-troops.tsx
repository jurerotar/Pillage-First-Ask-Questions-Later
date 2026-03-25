import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param.ts';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs.tsx';
import { AttackRaidForm } from './send-troops/attack-raid-form.tsx';
import { FoundNewVillageForm } from './send-troops/found-new-village-form.tsx';
import { OasisOccupationForm } from './send-troops/oasis-occupation-form.tsx';
import { ReinforcementRelocationForm } from './send-troops/reinforcement-relocation-form.tsx';

const tabs = [
  'attack-or-raid',
  'reinforce-or-relocate',
  'occupy-oasis',
  'found-new-village',
];

export const RallyPointSendTroops = () => {
  const { t } = useTranslation();
  const { tabIndex, navigateToTab } = useTabParam(
    tabs,
    'rally-point-send-troops-tab',
  );

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="send-troops" />
        <Text as="h2">{t('Send troops')}</Text>
      </SectionContent>
      <Tabs
        value={tabs[tabIndex] ?? tabs[0]}
        onValueChange={(value) => {
          navigateToTab(value);
        }}
      >
        <TabList>
          <Tab value="attack-or-raid">{t('Attack or raid')}</Tab>
          <Tab value="reinforce-or-relocate">{t('Reinforce or relocate')}</Tab>
          <Tab value="occupy-oasis">{t('Occupy oasis')}</Tab>
          <Tab value="found-new-village">{t('Found new village')}</Tab>
        </TabList>
        <TabPanel value="attack-or-raid">
          <AttackRaidForm />
        </TabPanel>
        <TabPanel value="reinforce-or-relocate">
          <ReinforcementRelocationForm />
        </TabPanel>
        <TabPanel value="occupy-oasis">
          <OasisOccupationForm />
        </TabPanel>
        <TabPanel value="found-new-village">
          <FoundNewVillageForm />
        </TabPanel>
      </Tabs>
    </Section>
  );
};
