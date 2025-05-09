import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { DemolishBuilding } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/demolish-building';
import { RenameVillage } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/rename-village';
import { Alert } from 'app/components/ui/alert';

export const MainBuildingVillageManagement = () => {
  const { t } = useTranslation();

  return (
    <article className="flex flex-col gap-4">
      <Text as="h2">{t('Village management')}</Text>
      <Tabs>
        <TabList>
          <Tab>{t('Rename village')}</Tab>
          <Tab>{t('Demolish buildings')}</Tab>
          <Tab>{t('Capital')}</Tab>
        </TabList>
        <TabPanel>
          <RenameVillage />
        </TabPanel>
        <TabPanel>
          <DemolishBuilding />
        </TabPanel>
        <TabPanel>
          <Text as="h2">{t('Capital')}</Text>
          <Alert variant="warning">{t('This page is still under development')}</Alert>
        </TabPanel>
      </Tabs>
    </article>
  );
};
