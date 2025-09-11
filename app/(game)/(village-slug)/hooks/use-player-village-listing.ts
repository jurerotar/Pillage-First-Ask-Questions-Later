import { useSuspenseQuery } from '@tanstack/react-query';
import type { Village } from 'app/interfaces/models/game/village';
import { villagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { z } from 'zod';

const _getPlayerVillageListingSchema = z.strictObject({
  id: z.number(),
  tileId: z.number(),
  coordinates: {
    x: z.number(),
    y: z.number(),
  },
  name: z.string(),
  slug: z.string(),
  resourceFieldComposition: z.string(),
});

export const usePlayerVillageListing = () => {
  const { fetcher } = use(ApiContext);

  const { data: playerVillages } = useSuspenseQuery<Village[]>({
    queryKey: [villagesCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Village[]>('/me/villages');
      return data;
    },
  });

  return {
    playerVillages,
  };
};
