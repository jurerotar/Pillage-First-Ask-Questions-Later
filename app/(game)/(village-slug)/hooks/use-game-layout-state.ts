import { useMatches } from 'react-router';

export const useGameLayoutState = () => {
  const matches = useMatches();

  const isResourcesPageExact = matches.some(
    (match) => match?.id === 'resources-page',
  );
  const isVillagePageExact = matches.some(
    (match) => match?.id === 'village-page',
  );

  const shouldShowSidebars = isVillagePageExact || isResourcesPageExact;

  return {
    shouldShowSidebars,
  };
};
