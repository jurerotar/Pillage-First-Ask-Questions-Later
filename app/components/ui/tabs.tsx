import {
  type ReactTabsFunctionComponent,
  Tab as ReactTabsTab,
  type TabProps,
  TabList as ReactTabsTabList,
  type TabListProps,
  TabPanel as ReactTabsTabPanel,
  type TabPanelProps,
  Tabs as ReactTabsTabs,
  type TabsProps,
} from 'react-tabs';

export const Tabs: ReactTabsFunctionComponent<TabsProps> = ({ children, ...rest }) => {
  return <ReactTabsTabs {...rest}>{children}</ReactTabsTabs>;
};

Tabs.tabsRole = 'Tabs';

export const TabList: ReactTabsFunctionComponent<TabListProps> = ({ children, ...rest }) => {
  return (
    <ReactTabsTabList
      className="flex mb-[-1px] overflow-x-scroll scrollbar-hidden"
      {...rest}
    >
      {children}
    </ReactTabsTabList>
  );
};

TabList.tabsRole = 'TabList';

export const Tab: ReactTabsFunctionComponent<TabProps> = ({ children, ...rest }) => {
  return (
    <ReactTabsTab
      selectedClassName="border-b-0 bg-white"
      className="flex whitespace-nowrap text-center justify-center p-2 px-4 cursor-pointer border-t border-b border-r border-gray-500 first:border-l border-l-0 bg-gray-200"
      {...rest}
    >
      {children}
    </ReactTabsTab>
  );
};

Tab.tabsRole = 'Tab';

export const TabPanel: ReactTabsFunctionComponent<TabPanelProps> = ({ children, ...rest }) => {
  return (
    <ReactTabsTabPanel
      selectedClassName="border border-black p-2"
      {...rest}
    >
      {children}
    </ReactTabsTabPanel>
  );
};

TabPanel.tabsRole = 'TabPanel';
