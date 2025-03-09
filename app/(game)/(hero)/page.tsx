import { useTabParam } from 'app/(game)/hooks/routes/use-tab-param';
import { TabList, TabPanel, Tabs } from 'react-tabs';
import { StyledTab } from 'app/components/styled-tab';

const HeroPage = () => {
  const tabs = ['default', 'adventures', 'auctions'];

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  return (
    <Tabs
      selectedIndex={tabIndex}
      onSelect={(index) => {
        navigateToTab(tabs[index]);
      }}
    >
      <TabList className="flex mb-2 overflow-x-scroll scrollbar-hidden">
        <StyledTab>Default</StyledTab>
        <StyledTab>Adventures</StyledTab>
        <StyledTab>Auctions</StyledTab>
      </TabList>
      <TabPanel>
        <div className="border border-gray-500 p-2">Default</div>
      </TabPanel>
      <TabPanel>Adventures</TabPanel>
      <TabPanel>Auctions</TabPanel>
    </Tabs>
  );
};

export default HeroPage;
