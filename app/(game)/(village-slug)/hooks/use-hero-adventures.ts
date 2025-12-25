import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { adventurePointsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { heroAdventuresSchema } from 'app/interfaces/models/game/hero-adventures';

export const useHeroAdventures = () => {
  const { fetcher } = use(ApiContext);

  const {
    data: { available, completed },
  } = useSuspenseQuery({
    queryKey: [adventurePointsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/me/hero/adventures');

      return heroAdventuresSchema.parse(data);
    },
  });

  return {
    available,
    completed,
  };
};
