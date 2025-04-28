import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { TabList, TabPanel, Tabs } from 'react-tabs';
import { StyledTab } from 'app/components/styled-tab';
import { useTranslation } from 'react-i18next';
import { WarningAlert } from 'app/components/alert';

const StatisticsPage = () => {
  const { t } = useTranslation();

  const tabs = ['default', 'villages', 'week-by-week'];

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  return (
    <Tabs
      selectedIndex={tabIndex}
      onSelect={(index) => {
        navigateToTab(tabs[index]);
      }}
    >
      <TabList className="flex mb-2 overflow-x-scroll scrollbar-hidden">
        <StyledTab>{t('Overview')}</StyledTab>
        <StyledTab>{t('Villages')}</StyledTab>
        <StyledTab>{t('Week by week')}</StyledTab>
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
  );
};

export default StatisticsPage;
