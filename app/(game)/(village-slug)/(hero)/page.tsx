import { useTranslation } from 'react-i18next';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(hero)/+types/page';
import { Adventures } from 'app/(game)/(village-slug)/(hero)/components/adventures';
import { Auctions } from 'app/(game)/(village-slug)/(hero)/components/auctions';
import { HeroAttributes } from 'app/(game)/(village-slug)/(hero)/components/hero-attributes';
import { HeroInventory } from 'app/(game)/(village-slug)/(hero)/components/hero-inventory';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { calculateHeroLevel } from 'app/(game)/(village-slug)/hooks/utils/hero';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const HeroPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();
  const { experience } = useHero();
  const { server } = useServer();
  const { level } = calculateHeroLevel(experience);
  const { name } = server!.playerConfiguration!;

  const tabs = ['default', 'inventory', 'adventures', 'auctions'];

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  const title = `${t('Hero')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="../resources">{t('Resources')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Hero')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">
        {name} - {t('level {{level}}', { level })}
      </Text>
      <Text>
        {t(
          'The Hero is your strongest unit. It can be improved and equipped with powerful items. The Hero does not need to be researched or trained and is available from the start. The hero can attack or defend like other units, but is the only one who can go on adventures for loot and conquer oases for bonus resources.',
        )}
      </Text>
      <Tabs
        selectedIndex={tabIndex}
        onSelect={(index) => {
          navigateToTab(tabs[index]);
        }}
      >
        <TabList>
          <Tab>{t('Attributes')}</Tab>
          <Tab>{t('Inventory')}</Tab>
          <Tab>{t('Adventures')}</Tab>
          <Tab>{t('Auctions')}</Tab>
        </TabList>
        <TabPanel>
          <HeroAttributes />
        </TabPanel>
        <TabPanel>
          <HeroInventory />
        </TabPanel>
        <TabPanel>
          <Adventures />
        </TabPanel>
        <TabPanel>
          <Auctions />
        </TabPanel>
      </Tabs>
    </>
  );
};

export default HeroPage;
