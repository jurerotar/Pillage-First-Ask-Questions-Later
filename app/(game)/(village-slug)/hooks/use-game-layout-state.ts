import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';

export const useGameLayoutState = () => {
  const isWiderThanMd = useMediaQuery('(min-width: 768px)');
  const { isVillagePageExact, isResourcesPageExact } = useGameNavigation();

  const shouldShowSidebars = (() => {
    if (isWiderThanMd) {
      return true;
    }

    return isVillagePageExact || isResourcesPageExact;
  })();

  return {
    shouldShowSidebars,
  };
};
