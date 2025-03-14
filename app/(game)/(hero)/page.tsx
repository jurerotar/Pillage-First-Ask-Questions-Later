import { useTabParam } from 'app/(game)/hooks/routes/use-tab-param';
import { TabList, TabPanel, Tabs } from 'react-tabs';
import { StyledTab } from 'app/components/styled-tab';
import { useTranslation } from 'react-i18next';

const HeroPage = () => {
  const { t } = useTranslation();

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
        <StyledTab>{t('Overview')}</StyledTab>
        <StyledTab>{t('Adventures')}</StyledTab>
        <StyledTab>{t('Auctions')}</StyledTab>
      </TabList>
      <TabPanel>
        <div className="border border-gray-500 p-2">{t('Overview')}</div>
      </TabPanel>
      <TabPanel>{t('Adventures')}</TabPanel>
      <TabPanel>{t('Auctions')}</TabPanel>
    </Tabs>
  );
};

export default HeroPage;
