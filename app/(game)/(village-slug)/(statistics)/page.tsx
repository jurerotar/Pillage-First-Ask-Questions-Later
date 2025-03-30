import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { TabList, TabPanel, Tabs } from 'react-tabs';
import { StyledTab } from 'app/components/styled-tab';
import { useTranslation } from 'react-i18next';

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
        <div className="border border-gray-500 p-2">{t('Default')}</div>
      </TabPanel>
      <TabPanel>{t('Villages')}</TabPanel>
      <TabPanel>{t('Week by week')}</TabPanel>
    </Tabs>
  );
};

export default StatisticsPage;
