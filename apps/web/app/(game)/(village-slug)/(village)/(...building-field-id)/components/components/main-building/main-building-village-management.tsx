import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { DemolishBuilding } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/main-building/components/demolish-building';
import { RearrangeBuildingFields } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/main-building/components/rearrange-building-fields.tsx';
import { RenameVillage } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/main-building/components/rename-village';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const tabs = [
  'rename-village',
  'demolish-buildings',
  'rearrange-building-fields',
];

export const MainBuildingVillageManagement = () => {
  const { t } = useTranslation();
  const { tabIndex, navigateToTab } = useTabParam(
    tabs,
    'main-building-village-management-tab',
  );

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="village-management" />
        <Text as="h2">{t('Village management')}</Text>
        <Text>
          {t(
            'The main building is the administrative center of your village. From here, you can rename your village and manage its infrastructure. If needed, you can also demolish existing buildings to make room for new development or restructure your layout.',
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
          <Tab value="rename-village">{t('Rename village')}</Tab>
          <Tab value="demolish-buildings">{t('Demolish buildings')}</Tab>
          <Tab value="rearrange-building-fields">{t('Demolish buildings')}</Tab>
        </TabList>
        <TabPanel value="rename-village">
          <RenameVillage />
        </TabPanel>
        <TabPanel value="demolish-buildings">
          <DemolishBuilding />
        </TabPanel>
        <TabPanel value="rearrange-building-fields">
          <RearrangeBuildingFields />
        </TabPanel>
      </Tabs>
    </Section>
  );
};
