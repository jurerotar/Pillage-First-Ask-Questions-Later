import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { WarningAlert } from 'app/components/ui/alert';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from 'app/components/ui/breadcrumb';
import { Text } from 'app/components/text';

const StatisticsPage = () => {
  const { t } = useTranslation();
  const { resourcesPath } = useGameNavigation();

  const tabs = ['default', 'villages', 'week-by-week'];

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to={resourcesPath}>{t('Resources')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Statistics')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">{t('Statistics')}</Text>
      <Tabs
        selectedIndex={tabIndex}
        onSelect={(index) => {
          navigateToTab(tabs[index]);
        }}
      >
        <TabList>
          <Tab>{t('Overview')}</Tab>
          <Tab>{t('Villages')}</Tab>
          <Tab>{t('Week by week')}</Tab>
        </TabList>
        <TabPanel>
          <WarningAlert>{t('This page is still under development')}</WarningAlert>
        </TabPanel>
        <TabPanel>
          <WarningAlert>{t('This page is still under development')}</WarningAlert>
        </TabPanel>
        <TabPanel>
          <WarningAlert>{t('This page is still under development')}</WarningAlert>
        </TabPanel>
      </Tabs>
    </>
  );
};

export default StatisticsPage;
