import type { QueryClient } from '@tanstack/react-query';
import type { Hero } from 'app/interfaces/models/game/hero';
import { heroCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const addHeroExperience = (queryClient: QueryClient, experience: number) => {
  queryClient.setQueryData<Hero>([heroCacheKey], (hero) => {
    hero!.stats.experience += experience;

    return {
      ...hero!,
      stats: {
        ...hero!.stats,
        experience: hero!.stats.experience + experience,
      },
    } satisfies Hero;
  });
};
