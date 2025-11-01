import { useSuspenseQuery } from '@tanstack/react-query';
import { effectSchema } from 'app/interfaces/models/game/effect';
import { effectsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { z } from 'zod';
import type { Building } from 'app/interfaces/models/game/building';

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
