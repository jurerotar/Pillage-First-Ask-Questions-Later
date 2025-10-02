import { useSuspenseQuery } from '@tanstack/react-query';
import { adventurePointsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { HeroAdventures } from 'app/interfaces/models/game/hero-adventures';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { z } from 'zod';

const _getHeroAdventuresSchema = z.strictObject({
  available: z.number(),
  completed: z.number(),
});

export const useHeroAdventures = () => {
  const { fetcher } = use(ApiContext);

  const {
    data: { available, completed },
  } = useSuspenseQuery<HeroAdventures>({
    queryKey: [adventurePointsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<HeroAdventures>('/me/hero/adventures');
      return data;
    },
  });

  return {
    available,
    completed,
  };
};
