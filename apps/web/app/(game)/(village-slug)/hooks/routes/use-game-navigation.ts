import { useCallback } from 'react';
import { useLocation } from 'react-router';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';

export const useGameNavigation = () => {
  const { currentVillage } = useCurrentVillage();
  const { pathname, search } = useLocation();

  const getNewVillageUrl = useCallback(
    (slug: string) => {
      return `${pathname.replace(currentVillage.slug, slug)}${search}`;
    },
    [pathname, search, currentVillage],
  );

  return {
    getNewVillageUrl,
  };
};
