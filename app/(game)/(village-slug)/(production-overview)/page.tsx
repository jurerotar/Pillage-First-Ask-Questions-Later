import { useTranslation } from 'react-i18next';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { ProductionOverview } from 'app/(game)/(village-slug)/(production-overview)/components/production-overview';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Text } from 'app/components/text';
import type React from 'react';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(production-overview)/+types/page';

const ProductionOverviewPage: React.FC<Route.ComponentProps> = ({ params }) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();
  const { resourcesPath } = useGameNavigation();

  const tabs = ['wood', 'clay', 'iron', 'wheat'];

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  const title = `${t('Production overview')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
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
        <TabList>
          <Tab>{t('Wood')}</Tab>
          <Tab>{t('Clay')}</Tab>
          <Tab>{t('Iron')}</Tab>
          <Tab>{t('Wheat')}</Tab>
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
