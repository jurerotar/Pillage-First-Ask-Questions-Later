import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { use } from 'react';
import { ViewportContext } from 'app/providers/viewport-context';

export const useGameLayoutState = () => {
  const { isWiderThanMd } = use(ViewportContext);
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
