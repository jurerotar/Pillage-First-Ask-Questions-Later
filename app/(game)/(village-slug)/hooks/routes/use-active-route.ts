import { useMatch } from 'react-router';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';

export const useActiveRoute = () => {
  const { villagePath, resourcesPath, mapPath, heroPath } = useGameNavigation();

  const villageMatch = useMatch(villagePath);
  const resourcesMatch = useMatch(resourcesPath);
  const mapMatch = useMatch(mapPath);
  const heroMatch = useMatch(heroPath);

  const isVillagePageOpen = !!villageMatch;
  const isResourcesPageOpen = !!resourcesMatch && !isVillagePageOpen;
  const isMapPageOpen = !!mapMatch;
  const isHeroPageOpen = !!heroMatch;

  const isVillagePageExact = villageMatch?.pathname === villagePath;
  const isResourcesPageExact = resourcesMatch?.pathname === resourcesPath;

  return {
    isResourcesPageOpen,
    isVillagePageOpen,
    isMapPageOpen,
    isHeroPageOpen,
    isVillagePageExact,
    isResourcesPageExact,
  };
};
