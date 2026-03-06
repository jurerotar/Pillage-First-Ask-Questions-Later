import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import type { BuildingId } from '@pillage-first/types/models/building';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import { unitTrainingHistoryCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { ApiContext } from 'app/(game)/providers/api-provider';

const unitTrainingHistorySchema = z.strictObject({
  batchId: z.string(),
  unit: unitIdSchema,
  building: buildingIdSchema,
  amount: z.number(),
  timestamp: z.number(),
});

export const useUnitTrainingHistory = (buildingId: BuildingId) => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: unitTrainingHistory } = useSuspenseQuery({
    queryKey: [unitTrainingHistoryCacheKey, currentVillage.id, buildingId],
    queryFn: async () => {
      const { data } = await fetcher(
        `/villages/${currentVillage.id}/history/units`,
        {
          body: {
            buildingId,
          },
        },
      );

      return z.array(unitTrainingHistorySchema).parse(data);
    },
  });

  return {
    unitTrainingHistory,
  };
};
