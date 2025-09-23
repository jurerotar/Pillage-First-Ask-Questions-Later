import { useMatches } from 'react-router';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';

export const useGameLayoutState = () => {
  const matches = useMatches();
  const isWiderThanMd = useMediaQuery('(min-width: 768px)');

  const isResourcesPageExact = matches.some(
    (match) => match?.id === 'resources-page',
  );
  const isVillagePageExact = matches.some(
    (match) => match?.id === 'village-page',
  );

  const shouldShowSidebars =
    isWiderThanMd || isVillagePageExact || isResourcesPageExact;

  return {
    shouldShowSidebars,
  };
};
