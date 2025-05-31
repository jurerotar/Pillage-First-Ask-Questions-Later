import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { DemolishBuilding } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/demolish-building';
import { RenameVillage } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/rename-village';
import {
  BuildingSection,
  BuildingSectionContent,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/building-layout';

export const MainBuildingVillageManagement = () => {
  const { t } = useTranslation();

  return (
    <BuildingSection>
      <BuildingSectionContent>
        <Text as="h2">{t('Village management')}</Text>
        <Text as="p">
          {t(
            'The main building is the administrative center of your village. From here, you can rename your village and manage its infrastructure. If needed, you can also demolish existing buildings to make room for new development or restructure your layout.',
          )}
        </Text>
      </BuildingSectionContent>
      <Tabs>
        <TabList>
          <Tab>{t('Rename village')}</Tab>
          <Tab>{t('Demolish buildings')}</Tab>
        </TabList>
        <TabPanel>
          <BuildingSectionContent>
            <RenameVillage />
          </BuildingSectionContent>
        </TabPanel>
        <TabPanel>
          <BuildingSectionContent>
            <DemolishBuilding />
          </BuildingSectionContent>
        </TabPanel>
      </Tabs>
    </BuildingSection>
  );
};
