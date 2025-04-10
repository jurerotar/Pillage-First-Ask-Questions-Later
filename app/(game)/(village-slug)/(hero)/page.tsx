import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { TabList, TabPanel, Tabs } from 'react-tabs';
import { StyledTab } from 'app/components/styled-tab';
import { useTranslation } from 'react-i18next';
import { Adventures } from 'app/(game)/(village-slug)/(hero)/components/adventures';
import type { MetaFunction } from 'react-router';
import heroItemsAssetsPreloadPaths from 'app/asset-preload-paths/hero-items.json';

export const meta: MetaFunction = () => {
  const { files } = heroItemsAssetsPreloadPaths;
  return files.map((href) => ({
    rel: 'preload',
    href,
    as: 'image',
    type: 'image/avif',
  }));
};

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
      <TabPanel>{t('Overview')}</TabPanel>
      <TabPanel>
        <Adventures />
      </TabPanel>
      <TabPanel>{t('Auctions')}</TabPanel>
    </Tabs>
  );
};

export default HeroPage;
