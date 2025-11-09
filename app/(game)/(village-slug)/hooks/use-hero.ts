import { useSuspenseQuery } from '@tanstack/react-query';
import { heroCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { heroSchema } from 'app/interfaces/models/game/hero';

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
