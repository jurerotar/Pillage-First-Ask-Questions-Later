import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { useLocation } from 'react-router';

const RESOURCES_PAGE_PATH = '/resources';
const VILLAGE_PAGE_PATH = '/village';
const MAP_PAGE_PATH = '/map';
const REPORTS_PAGE_PATH = '/reports';
const AUCTIONS_PAGE_PATH = '/auctions';

export const useGameNavigation = () => {
  const { pathname } = useLocation();
  const {
    currentVillage: { coordinates },
  } = useCurrentVillage();

  const [, game, server, village] = pathname.split('/');

  const basePath = `/${game}/${server}/${village}`;

  const resourcesPath = `${basePath}${RESOURCES_PAGE_PATH}`;
  const villagePath = `${basePath}${VILLAGE_PAGE_PATH}`;
  const mapPath = `${basePath}${MAP_PAGE_PATH}`;
  const reportsPath = `${basePath}${REPORTS_PAGE_PATH}`;
  const auctionsPath = `${basePath}${AUCTIONS_PAGE_PATH}`;
  const currentVillageMapPath = `${mapPath}?x=${coordinates.x}&y=${coordinates.y}`;

  const isVillagePageOpen = pathname.includes(VILLAGE_PAGE_PATH);
  const isResourcesPageOpen = pathname.includes(RESOURCES_PAGE_PATH) && !isVillagePageOpen;
  const isMapPageOpen = pathname.includes(MAP_PAGE_PATH);
  const isReportsPageOpen = pathname.includes(REPORTS_PAGE_PATH);
  const isAuctionsPageOpen = pathname.includes(AUCTIONS_PAGE_PATH);

  return {
    resourcesPath,
    villagePath,
    mapPath,
    reportsPath,
    auctionsPath,
    currentVillageMapPath,
    isResourcesPageOpen,
    isVillagePageOpen,
    isMapPageOpen,
    isReportsPageOpen,
    isAuctionsPageOpen,
  };
};
