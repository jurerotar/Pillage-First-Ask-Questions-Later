import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { heroSchema } from '@pillage-first/types/models/hero';
import { heroCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useHero = () => {
  const { fetcher } = use(ApiContext);

  const { data: hero } = useSuspenseQuery({
    queryKey: [heroCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/me/hero');

      return heroSchema.parse(data);
    },
  });

  const { health, experience } = hero.stats;
  const isHeroAlive = health > 0;

  return {
    hero,
    experience,
    health,
    isHeroAlive,
  };
};
