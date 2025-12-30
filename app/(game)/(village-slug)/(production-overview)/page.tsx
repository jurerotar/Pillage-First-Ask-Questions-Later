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
        value={tabs[tabIndex] ?? tabs[0]}
        onValueChange={(value: string) => {
          navigateToTab(value);
        }}
      >
        <TabList>
          <Tab value="wood">{t('Wood')}</Tab>
          <Tab value="clay">{t('Clay')}</Tab>
          <Tab value="iron">{t('Iron')}</Tab>
          <Tab value="wheat">{t('Wheat')}</Tab>
        </TabList>
        <TabPanel value="wood">
          <ProductionOverview effectId="woodProduction" />
        </TabPanel>
        <TabPanel value="clay">
          <ProductionOverview effectId="clayProduction" />
        </TabPanel>
        <TabPanel value="iron">
          <ProductionOverview effectId="ironProduction" />
        </TabPanel>
        <TabPanel value="wheat">
          <ProductionOverview effectId="wheatProduction" />
        </TabPanel>
      </Tabs>
    </>
  );
};

export default ProductionOverviewPage;
