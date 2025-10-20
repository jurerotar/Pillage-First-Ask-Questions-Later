import { useSuspenseQuery } from '@tanstack/react-query';
import type { Hero } from 'app/interfaces/models/game/hero';
import { heroCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { z } from 'zod';

const _getHeroSchema = z.strictObject({
  stats: z.strictObject({
    health: z.number(),
    experience: z.number(),
  }),
  selectableAttributes: z.strictObject({
    attackPower: z.number(),
    resourceProduction: z.number(),
    attackBonus: z.number(),
    defenceBonus: z.number(),
  }),
  resourceProduction: z.enum(['wood', 'clay', 'iron', 'wheat', 'shared']),
  adventureCount: z.number(),
});

export const useHero = () => {
  const { fetcher } = use(ApiContext);

  const { data: hero } = useSuspenseQuery({
    queryKey: [heroCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Hero>('/me/hero');
      return data;
    },
  });

  const isHeroAlive = hero.stats.health > 0;
  const experience = hero.stats.experience;
  const health = hero.stats.health;

  return {
    hero,
    experience,
    health,
    isHeroAlive,
  };
};
