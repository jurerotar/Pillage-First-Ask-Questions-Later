import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { useActiveRoute } from 'app/(game)/(village-slug)/hooks/routes/use-active-route';

export const useGameLayoutState = () => {
  const isWiderThanMd = useMediaQuery('(min-width: 768px)');
  const { isVillagePageExact, isResourcesPageExact } = useActiveRoute();

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
