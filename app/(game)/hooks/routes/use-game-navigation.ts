import { useLocation } from 'react-router';

const resourcesPagePath = '/resources';
const villagePagePath = '/village';
const mapPagePath = '/map';
const reportsPagePath = '/reports';
const questsPagePath = '/quests';
const heroPagePath = '/hero';
const statisticsPagePath = '/statistics';
const auctionsPagePath = `${heroPagePath}?tab=auctions`;
const adventuresPagePath = `${heroPagePath}?tab=adventures`;
const preferencesPagePath = '/preferences';
const overviewPagePath = '/overview';
const communityPagePath = '/community';

export const useGameNavigation = () => {
  const { pathname } = useLocation();

  const [, game, server, village] = pathname.split('/');

  const baseGamePath = `/${game}/${server}`;
  const baseVillagePath = `${baseGamePath}/${village}`;

  const resourcesPath = `${baseVillagePath}${resourcesPagePath}`;
  const villagePath = `${baseVillagePath}${villagePagePath}`;
  const mapPath = `${baseVillagePath}${mapPagePath}`;
  const reportsPath = `${baseVillagePath}${reportsPagePath}`;
  const heroPath = `${baseVillagePath}${heroPagePath}`;
  const auctionsPath = `${baseVillagePath}${auctionsPagePath}`;
  const adventuresPath = `${baseVillagePath}${adventuresPagePath}`;
  const questsPath = `${baseVillagePath}${questsPagePath}`;
  const statisticsPath = `${baseVillagePath}${statisticsPagePath}`;
  const preferencesPath = `${baseVillagePath}${preferencesPagePath}`;
  const overviewPath = `${baseVillagePath}${overviewPagePath}`;
  const communityPath = `${baseVillagePath}${communityPagePath}`;

  const isVillagePageOpen = pathname.includes(villagePagePath);
  const isResourcesPageOpen = pathname.includes(resourcesPagePath) && !isVillagePageOpen;
  const isMapPageOpen = pathname.includes(mapPagePath);
  const isHeroPageOpen = pathname.includes(heroPath);

  return {
    baseGamePath,
    baseVillagePath,
    resourcesPath,
    villagePath,
    mapPath,
    reportsPath,
    heroPath,
    auctionsPath,
    adventuresPath,
    questsPath,
    statisticsPath,
    preferencesPath,
    overviewPath,
    communityPath,
    isResourcesPageOpen,
    isVillagePageOpen,
    isMapPageOpen,
    isHeroPageOpen,
  };
};
