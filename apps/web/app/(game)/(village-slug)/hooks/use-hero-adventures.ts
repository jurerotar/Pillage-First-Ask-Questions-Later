import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { heroAdventuresSchema } from '@pillage-first/types/models/hero-adventures';
import { adventurePointsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

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
