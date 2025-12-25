import { useTranslation } from 'react-i18next';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(production-overview)/+types/page';
import { ProductionOverview } from 'app/(game)/(village-slug)/(production-overview)/components/production-overview';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const ProductionOverviewPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();

  const tabs = ['wood', 'clay', 'iron', 'wheat'];

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  const title = `${t('Production overview')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="../resources">{t('Resources')}</BreadcrumbLink>
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
