import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { FoundNewVillageForm } from 'app/(game)/(village-slug)/components/send-troops/found-new-village-form';
import { ReinforcementRelocationForm } from 'app/(game)/(village-slug)/components/send-troops/reinforcement-relocation-form';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { AttackRaidForm } from 'app/(game)/(village-slug)/components/send-troops/attack-raid-form';

// import { OasisOccupationForm } from './send-troops/oasis-occupation-form';

const tabs = [
  'attack-or-raid',
  'reinforce-or-relocate',
  // 'occupy-oasis',
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
        <InformationPopover ariaLabel={t('Send troops')}>
          <Text>
            {t(
              'Send troops to reinforce, relocate, or found a new village. Choose the action tab that matches the mission before selecting the destination and units.',
            )}
          </Text>
        </InformationPopover>
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
          {/*<Tab value="occupy-oasis">{t('Occupy oasis')}</Tab>*/}
          <Tab value="found-new-village">{t('Found new village')}</Tab>
        </TabList>
        <TabPanel value="attack-or-raid">
          <AttackRaidForm />
        </TabPanel>
        <TabPanel value="reinforce-or-relocate">
          <ReinforcementRelocationForm />
        </TabPanel>
        {/*<TabPanel value="occupy-oasis">*/}
        {/*  <OasisOccupationForm />*/}
        {/*</TabPanel>*/}
        <TabPanel value="found-new-village">
          <FoundNewVillageForm />
        </TabPanel>
      </Tabs>
    </Section>
  );
};
