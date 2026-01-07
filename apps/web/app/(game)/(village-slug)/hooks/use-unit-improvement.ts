import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import { unitImprovementCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

const getUnitImprovementsSchema = z.strictObject({
  unitId: unitIdSchema,
  level: z.number(),
});

export const useUnitImprovement = () => {
  const { fetcher } = use(ApiContext);

  const { data: unitImprovements } = useSuspenseQuery({
    queryKey: [unitImprovementCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/me/unit-improvements');

      return z.array(getUnitImprovementsSchema).parse(data);
    },
  });

  return {
    unitImprovements,
  };
};
