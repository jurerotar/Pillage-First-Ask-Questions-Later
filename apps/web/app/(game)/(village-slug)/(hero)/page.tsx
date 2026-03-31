import { useTranslation } from 'react-i18next';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(hero)/+types/page';
import { Auctions } from 'app/(game)/(village-slug)/(hero)/components/auctions';
import { HeroAdventures } from 'app/(game)/(village-slug)/(hero)/components/hero-adventures.tsx';
import { HeroAttributes } from 'app/(game)/(village-slug)/(hero)/components/hero-attributes';
import { HeroInventory } from 'app/(game)/(village-slug)/(hero)/components/hero-inventory';
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

const tabs = ['default', 'inventory', 'adventures', 'auctions'];

const HeroPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  const title = `${t('Hero')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="../village">{t('Village')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Hero')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">{t('Hero')}</Text>
      <Text>
        {t(
          'The Hero is your strongest unit. It can be improved and equipped with powerful items. The Hero does not need to be researched or trained and is available from the start. The hero can attack or defend like other units, but is the only one who can go on adventures for loot and conquer oases for bonus resources.',
        )}
      </Text>
      <Tabs
        value={tabs[tabIndex] ?? 'default'}
        onValueChange={(value) => {
          navigateToTab(value);
        }}
      >
        <TabList>
          <Tab value="default">{t('Attributes')}</Tab>
          <Tab value="inventory">{t('Inventory')}</Tab>
          <Tab value="adventures">{t('Adventures')}</Tab>
          <Tab value="auctions">{t('Auctions')}</Tab>
        </TabList>
        <TabPanel value="default">
          <HeroAttributes />
        </TabPanel>
        <TabPanel value="inventory">
          <HeroInventory />
        </TabPanel>
        <TabPanel value="adventures">
          <HeroAdventures />
        </TabPanel>
        <TabPanel value="auctions">
          <Auctions />
        </TabPanel>
      </Tabs>
    </>
  );
};

export default HeroPage;
