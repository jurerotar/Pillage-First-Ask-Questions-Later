import { useCallback } from 'react';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';

export const useGameNavigation = () => {
  const { serverSlug } = useRouteSegments();

  const getNewVillageUrl = useCallback(
    (slug: string) => {
      return `/game/${serverSlug}/${slug}/resources`;
    },
    [serverSlug],
  );

  return {
    getNewVillageUrl,
  };
};
