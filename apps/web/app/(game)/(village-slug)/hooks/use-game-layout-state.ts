import { useMatches } from 'react-router';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';

export const useGameLayoutState = () => {
  const matches = useMatches();
  const hasSidebarViewport = useMediaQuery(
    '(min-width: 1024px), (min-width: 768px) and (min-height: 768px)',
  );

  const isResourcesPageExact = matches.some(
    (match) => match?.id === 'resources-page',
  );
  const isVillagePageExact = matches.some(
    (match) => match?.id === 'village-page',
  );
  const isMapPage = matches.some((match) => match?.id === 'map-page');

  const shouldShowSidebars =
    !isMapPage &&
    (hasSidebarViewport || isVillagePageExact || isResourcesPageExact);

  return {
    shouldShowSidebars,
  };
};
