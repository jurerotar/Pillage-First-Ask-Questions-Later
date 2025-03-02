import { useTabParam } from 'app/(game)/hooks/routes/use-tab-param';
import { TabList, TabPanel, Tabs } from 'react-tabs';
import { StyledTab } from 'app/components/styled-tab';

const StatisticsPage = () => {
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
        <StyledTab>Overview</StyledTab>
        <StyledTab>Villages</StyledTab>
        <StyledTab>Week by week</StyledTab>
      </TabList>
      <TabPanel>
        <div className="border border-gray-500 p-2">Default</div>
      </TabPanel>
      <TabPanel>Villages</TabPanel>
      <TabPanel>Week by week</TabPanel>
    </Tabs>
  );
};

export default StatisticsPage;
