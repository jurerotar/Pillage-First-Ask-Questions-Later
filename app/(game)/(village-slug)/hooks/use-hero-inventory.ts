import { useSuspenseQuery } from '@tanstack/react-query';
import { heroInventoryCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { z } from 'zod';

const _getHeroInventorySchema = z.strictObject({
  id: z.string(),
  amount: z.number(),
});

export const useHeroInventory = () => {
  const { fetcher } = use(ApiContext);

  const { data: heroInventory } = useSuspenseQuery<
    z.infer<typeof _getHeroInventorySchema>[]
  >({
    queryKey: [heroInventoryCacheKey],
    queryFn: async () => {
      const { data } =
        await fetcher<z.infer<typeof _getHeroInventorySchema>[]>(
          '/me/hero/inventory',
        );
      return data;
    },
  });

  return {
    heroInventory,
  };
};
