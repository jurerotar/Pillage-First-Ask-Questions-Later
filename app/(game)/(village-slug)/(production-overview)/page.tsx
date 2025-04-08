import { useTranslation } from 'react-i18next';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { TabList, TabPanel, Tabs } from 'react-tabs';
import { StyledTab } from 'app/components/styled-tab';
import { ProductionOverview } from 'app/(game)/(village-slug)/(production-overview)/components/production-overview';

const ProductionOverviewPage = () => {
  const { t } = useTranslation();

  const tabs = ['wood', 'clay', 'iron', 'wheat'];

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  return (
    <Tabs
      selectedIndex={tabIndex}
      onSelect={(index) => {
        navigateToTab(tabs[index]);
      }}
    >
      <TabList className="flex mb-2 overflow-x-scroll scrollbar-hidden">
        <StyledTab>{t('Wood')}</StyledTab>
        <StyledTab>{t('Clay')}</StyledTab>
        <StyledTab>{t('Iron')}</StyledTab>
        <StyledTab>{t('Wheat')}</StyledTab>
      </TabList>
      <TabPanel>
        <ProductionOverview effectId="woodProduction" />
      </TabPanel>
      <TabPanel>
        <ProductionOverview effectId="clayProduction" />
      </TabPanel>
      <TabPanel>
        <ProductionOverview effectId="ironProduction" />
      </TabPanel>
      <TabPanel>
        <ProductionOverview effectId="wheatProduction" />
      </TabPanel>
    </Tabs>
  );
};

export default ProductionOverviewPage;
