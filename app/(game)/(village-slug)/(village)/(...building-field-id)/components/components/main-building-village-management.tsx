import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { DemolishBuilding } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/demolish-building';
import { RenameVillage } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/rename-village';
import { Alert } from 'app/components/ui/alert';
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
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolorem labore laudantium maxime, natus neque nisi perspiciatis rem
          temporibus totam velit. Deserunt fuga nostrum officia placeat vel? Dolores ratione, vel? Repudiandae!
        </Text>
      </BuildingSectionContent>
      <Tabs>
        <TabList>
          <Tab>{t('Rename village')}</Tab>
          <Tab>{t('Demolish buildings')}</Tab>
          <Tab>{t('Capital')}</Tab>
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
        <TabPanel>
          <BuildingSectionContent>
            <Text as="h2">{t('Capital')}</Text>
            <Alert variant="warning">{t('This page is still under development')}</Alert>
          </BuildingSectionContent>
        </TabPanel>
      </Tabs>
    </BuildingSection>
  );
};
