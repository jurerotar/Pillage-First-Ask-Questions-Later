import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { Village } from 'app/interfaces/models/game/village';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { z } from 'zod';

const buildingFieldRowSchema = z.object({
  id: z.number(),
  buildingId: z.string(),
  level: z.number(),
});

const _getVillageBySlugSchema = z.strictObject({
  id: z.number(),
  tileId: z.number(),
  playerId: z.number(),
  name: z.string(),
  slug: z.string(),
  coordinates: {
    x: z.number(),
    y: z.number(),
  },
  lastUpdatedAt: z.number(),
  resources: {
    wood: z.number(),
    clay: z.number(),
    iron: z.number(),
    wheat: z.number(),
  },
  resourceFieldComposition: z.string(),
  buildingFields: z.array(buildingFieldRowSchema),
});

export const useCurrentVillage = () => {
  const { fetcher } = use(ApiContext);
  const { villageSlug } = useRouteSegments();

  const { data: currentVillage } = useSuspenseQuery({
    queryKey: [playerVillagesCacheKey, villageSlug],
    queryFn: async () => {
      const { data } = await fetcher<Village>(`/villages/${villageSlug}`);
      return data;
    },
    staleTime: 20_000,
  });

  return {
    currentVillage,
  };
};
