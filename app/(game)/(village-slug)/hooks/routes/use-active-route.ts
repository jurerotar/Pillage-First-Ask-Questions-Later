import { useLocation } from 'react-router';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';

export const useActiveRoute = () => {
  const { pathname } = useLocation();
  const { villagePath, resourcesPath, mapPath, heroPath } = useGameNavigation();

  const isVillagePageOpen = pathname.includes(villagePath);
  const isResourcesPageOpen = pathname.includes(resourcesPath) && !isVillagePageOpen;
  const isMapPageOpen = pathname.includes(mapPath);
  const isHeroPageOpen = pathname.includes(heroPath);

  const isVillagePageExact = pathname.endsWith(villagePath);
  const isResourcesPageExact = pathname.endsWith(resourcesPath);

  return {
    isResourcesPageOpen,
    isVillagePageOpen,
    isMapPageOpen,
    isHeroPageOpen,
    isVillagePageExact,
    isResourcesPageExact,
  };
};
