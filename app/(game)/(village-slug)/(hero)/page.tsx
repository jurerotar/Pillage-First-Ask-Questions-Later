import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { Adventures } from 'app/(game)/(village-slug)/(hero)/components/adventures';
import type { MetaFunction } from 'react-router';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from 'app/components/ui/breadcrumb';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Text } from 'app/components/text';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { calculateHeroLevel } from 'app/(game)/(village-slug)/hooks/utils/hero';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { HeroOverview } from 'app/(game)/(village-slug)/(hero)/components/hero-overview';
import { Auctions } from 'app/(game)/(village-slug)/(hero)/components/auctions';
import { t } from 'i18next';

export const meta: MetaFunction = ({ params }) => {
  const { serverSlug, villageSlug } = params;

  return [
    {
      title: `${t('Hero')} | Pillage First! - ${serverSlug} - ${villageSlug}`,
    },
  ];
};

const HeroPage = () => {
  const { t } = useTranslation();
  const { resourcesPath } = useGameNavigation();
  const { experience } = useHero();
  const { server } = useServer();
  const { level } = calculateHeroLevel(experience);
  const { name } = server!.playerConfiguration!;

  const tabs = ['default', 'adventures', 'auctions'];

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to={resourcesPath}>{t('Resources')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Hero')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">
        {name} - {t('level {{level}}', { level })}
      </Text>
      <Tabs
        selectedIndex={tabIndex}
        onSelect={(index) => {
          navigateToTab(tabs[index]);
        }}
      >
        <TabList>
          <Tab>{t('Overview')}</Tab>
          <Tab>{t('Adventures')}</Tab>
          <Tab>{t('Auctions')}</Tab>
        </TabList>
        <TabPanel>
          <HeroOverview />
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
