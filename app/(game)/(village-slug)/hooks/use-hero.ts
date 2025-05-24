import { useSuspenseQuery } from '@tanstack/react-query';
import type { Hero } from 'app/interfaces/models/game/hero';
import { heroCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useHero = () => {
  const { fetcher } = use(ApiContext);

  const { data: hero } = useSuspenseQuery<Hero>({
    queryKey: [heroCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Hero>('/hero');
      return data;
    },
  });

  const isHeroAlive = (hero?.stats?.health ?? 0) > 0;
  const experience = hero?.stats?.experience ?? 0;

  return {
    hero,
    experience,
    isHeroAlive,
  };
};
