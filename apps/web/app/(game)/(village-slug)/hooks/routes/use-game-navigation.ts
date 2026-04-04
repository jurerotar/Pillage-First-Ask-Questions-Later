import { useCallback } from 'react';
import { useLocation } from 'react-router';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server.ts';

export const useGameNavigation = () => {
  const { currentVillage } = useCurrentVillage();
  const { pathname, search } = useLocation();
  const { serverSlug } = useServer();

  const getVillageBasePath = useCallback(
    (slug: string) => {
      return `/game/${serverSlug}/${slug}`;
    },
    [serverSlug],
  );

  const getNewVillageUrl = useCallback(
    (slug: string) => {
      return `${pathname.replace(currentVillage.slug, slug)}${search}`;
    },
    [pathname, search, currentVillage],
  );

  return {
    getNewVillageUrl,
    getVillageBasePath,
  };
};
