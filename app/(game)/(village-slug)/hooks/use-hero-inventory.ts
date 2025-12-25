import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { heroInventoryCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { heroItemSchema } from 'app/interfaces/models/game/hero-item';

export const useHeroInventory = () => {
  const { fetcher } = use(ApiContext);

  const { data: heroInventory } = useSuspenseQuery({
    queryKey: [heroInventoryCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/me/hero/inventory');

      return z.array(heroItemSchema).parse(data);
    },
  });

  return {
    heroInventory,
  };
};
