import { useTranslation } from 'react-i18next';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { TabList, TabPanel, Tabs } from 'react-tabs';
import { StyledTab } from 'app/components/styled-tab';
import { ProductionOverview } from 'app/(game)/(village-slug)/(production-overview)/components/production-overview';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from 'app/components/ui/breadcrumb';
import { Text } from 'app/components/text';

const ProductionOverviewPage = () => {
  const { t } = useTranslation();
  const { resourcesPath } = useGameNavigation();

  const tabs = ['wood', 'clay', 'iron', 'wheat'];

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to={resourcesPath}>{t('Resources')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Production overview')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">{t('Production overview')}</Text>
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
    </>
  );
};

export default ProductionOverviewPage;
