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

export const useGameNavigation = () => {
  const { pathname } = useLocation();

  const [, game, server, village] = pathname.split('/');

  const basePath = `/${game}/${server}/${village}`;

  const resourcesPath = `${basePath}${resourcesPagePath}`;
  const villagePath = `${basePath}${villagePagePath}`;
  const mapPath = `${basePath}${mapPagePath}`;
  const reportsPath = `${basePath}${reportsPagePath}`;
  const heroPath = `${basePath}${heroPagePath}`;
  const auctionsPath = `${basePath}${auctionsPagePath}`;
  const adventuresPath = `${basePath}${adventuresPagePath}`;
  const questsPath = `${basePath}${questsPagePath}`;
  const statisticsPath = `${basePath}${statisticsPagePath}`;
  const preferencesPath = `${basePath}${preferencesPagePath}`;

  const isVillagePageOpen = pathname.includes(villagePagePath);
  const isResourcesPageOpen = pathname.includes(resourcesPagePath) && !isVillagePageOpen;
  const isMapPageOpen = pathname.includes(mapPagePath);

  return {
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
    isResourcesPageOpen,
    isVillagePageOpen,
    isMapPageOpen,
  };
};
