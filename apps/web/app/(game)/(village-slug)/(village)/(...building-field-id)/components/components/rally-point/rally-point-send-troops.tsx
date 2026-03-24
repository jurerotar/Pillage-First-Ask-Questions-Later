import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param.ts';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs.tsx';
import { SendTroopsForm, type UnitSelection } from './send-troops-form';

const tabs = [
  'attack-or-raid',
  'reinforce-or-relocate',
  'occupy-oasis',
  'found-new-village',
];

const mockUnits: UnitSelection[] = [
  { unitId: 'LEGIONNAIRE', available: 150, selected: 0, category: 'infantry' },
  { unitId: 'PRAETORIAN', available: 50, selected: 0, category: 'infantry' },
  { unitId: 'IMPERIAN', available: 0, selected: 0, category: 'infantry' },
  { unitId: 'EQUITES_LEGATI', available: 10, selected: 0, category: 'cavalry' },
  {
    unitId: 'EQUITES_IMPERATORIS',
    available: 0,
    selected: 0,
    category: 'cavalry',
  },
  {
    unitId: 'EQUITES_CAESARIS',
    available: 0,
    selected: 0,
    category: 'cavalry',
  },
  { unitId: 'ROMAN_RAM', available: 5, selected: 0, category: 'siege' },
  { unitId: 'ROMAN_CATAPULT', available: 0, selected: 0, category: 'siege' },
  {
    unitId: 'ROMAN_CHIEF',
    available: 0,
    selected: 0,
    category: 'administration',
  },
  {
    unitId: 'ROMAN_SETTLER',
    available: 3,
    selected: 0,
    category: 'administration',
  },
];

export const RallyPointSendTroops = () => {
  const { t } = useTranslation();
  const { tabIndex, navigateToTab } = useTabParam(
    tabs,
    'rally-point-send-troops-tab',
  );

  const handleSubmit = (data: any) => {
    console.log('Form submitted:', data);
  };

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="send-troops" />
        <Text as="h2">{t('Send units')}</Text>
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
          <SendTroopsForm
            initialUnits={mockUnits}
            onSubmit={handleSubmit}
            defaultAction="attack_normal"
          />
        </TabPanel>
        <TabPanel value="reinforce-or-relocate">
          <SendTroopsForm
            initialUnits={mockUnits}
            onSubmit={handleSubmit}
            defaultAction="reinforcement"
          />
        </TabPanel>
        <TabPanel value="occupy-oasis">
          <SendTroopsForm
            initialUnits={mockUnits}
            onSubmit={handleSubmit}
            defaultAction="oasis_occupation"
          />
        </TabPanel>
        <TabPanel value="found-new-village">
          <SendTroopsForm
            initialUnits={mockUnits}
            onSubmit={handleSubmit}
            defaultAction="found_new_village"
          />
        </TabPanel>
      </Tabs>
    </Section>
  );
};
