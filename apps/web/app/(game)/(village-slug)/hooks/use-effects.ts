import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import type { Building } from '@pillage-first/types/models/building';
import { effectSchema } from '@pillage-first/types/models/effect';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { effectsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

const getEffectsSchema = effectSchema.extend({
  buildingId: z.string().nullable().optional() as z.ZodType<Building['id']>,
});

export const useEffects = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: effects } = useSuspenseQuery({
    queryKey: [effectsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/villages/:villageId/effects', {
        path: {
          villageId: currentVillage.id,
        },
      });

      return z.array(getEffectsSchema).parse(data);
    },
  });

  return {
    effects,
  };
};
