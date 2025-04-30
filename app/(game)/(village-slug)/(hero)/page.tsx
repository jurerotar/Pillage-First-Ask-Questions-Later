import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { TabList, TabPanel, Tabs } from 'react-tabs';
import { StyledTab } from 'app/components/styled-tab';
import { useTranslation } from 'react-i18next';
import { Adventures } from 'app/(game)/(village-slug)/(hero)/components/adventures';
import type { MetaFunction } from 'react-router';
import heroItemsAssetsPreloadPaths from 'app/asset-preload-paths/hero-items.json';
import { WarningAlert } from 'app/components/alert';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from 'app/components/ui/breadcrumb';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Text } from 'app/components/text';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { calculateHeroLevel } from 'app/(game)/(village-slug)/hooks/utils/hero';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';

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
  const { resourcesPath } = useGameNavigation();
  const { hero } = useHero();
  const { server } = useServer();
  const { level } = calculateHeroLevel(hero.stats.experience);
  const { name } = server.playerConfiguration;

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
        <TabList className="flex mb-2 overflow-x-scroll scrollbar-hidden">
          <StyledTab>{t('Overview')}</StyledTab>
          <StyledTab>{t('Adventures')}</StyledTab>
          <StyledTab>{t('Auctions')}</StyledTab>
        </TabList>
        <TabPanel>
          <WarningAlert>{t('This page is still under development')}</WarningAlert>
        </TabPanel>
        <TabPanel>
          <Adventures />
        </TabPanel>
        <TabPanel>
          <WarningAlert>{t('This page is still under development')}</WarningAlert>
        </TabPanel>
      </Tabs>
    </>
  );
};

export default HeroPage;
