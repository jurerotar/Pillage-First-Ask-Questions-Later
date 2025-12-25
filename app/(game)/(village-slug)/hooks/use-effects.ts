import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { effectsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { Building } from 'app/interfaces/models/game/building';
import { effectSchema } from 'app/interfaces/models/game/effect';

const getEffectsSchema = effectSchema.extend({
  buildingId: z.string().nullable().optional() as z.ZodType<Building['id']>,
});

export const useEffects = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: effects } = useSuspenseQuery({
    queryKey: [effectsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher(`/villages/${currentVillage.id}/effects`);

      return z.array(getEffectsSchema).parse(data);
    },
  });

  return {
    effects,
  };
};
