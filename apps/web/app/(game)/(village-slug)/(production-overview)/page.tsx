import { useTranslation } from 'react-i18next';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(production-overview)/+types/page';
import { ProductionOverview } from 'app/(game)/(village-slug)/(production-overview)/components/production-overview';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { PageContents } from 'app/components/page-contents';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const tabs = ['wood', 'clay', 'iron', 'wheat'];

const ProductionOverviewPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  const title = `${t('Production overview')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <PageContents>
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
      <InformationPopover
        ariaLabel={t('Production overview')}
        className="top-2 right-2"
      >
        <Text>
          {t(
            'Review how base production, bonuses, oasis effects, hero bonuses and artifacts contribute to each resource.',
          )}
        </Text>
      </InformationPopover>
      <Text as="h1">{t('Production overview')}</Text>
      <Section>
        <SectionContent>
          <Tabs
            value={tabs[tabIndex] ?? tabs[0]}
            onValueChange={(value) => {
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
        </SectionContent>
      </Section>
    </PageContents>
  );
};

export default ProductionOverviewPage;
