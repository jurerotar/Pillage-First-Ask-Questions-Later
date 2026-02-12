import { useCallback } from 'react';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server.ts';

export const useGameNavigation = () => {
  const { serverSlug } = useServer();

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
