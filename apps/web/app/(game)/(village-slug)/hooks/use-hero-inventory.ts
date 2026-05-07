import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { heroItemSchema } from '@pillage-first/types/models/hero-item';
import { heroInventoryCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useMe } from './use-me';

export const useHeroInventory = () => {
  const { apiClient } = use(ApiContext);
  const { player } = useMe();

  const { data: heroInventory } = useSuspenseQuery({
    queryKey: [heroInventoryCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/players/:playerId/hero/inventory',
        {
          path: {
            playerId: player.id,
          },
        },
      );

      return z.array(heroItemSchema).parse(data);
    },
  });

  return {
    heroInventory,
  };
};
