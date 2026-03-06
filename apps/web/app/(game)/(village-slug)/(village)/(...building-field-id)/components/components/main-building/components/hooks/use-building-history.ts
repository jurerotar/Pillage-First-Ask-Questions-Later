import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { buildingHistoryCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { ApiContext } from 'app/(game)/providers/api-provider';

const buildingHistorySchema = z.strictObject({
  fieldId: z.number(),
  building: buildingIdSchema,
  previousLevel: z.number(),
  newLevel: z.number(),
  timestamp: z.number(),
});

export const useBuildingHistory = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: buildingHistory } = useSuspenseQuery({
    queryKey: [buildingHistoryCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher(
        `/villages/${currentVillage.id}/history/buildings`,
      );

      return z.array(buildingHistorySchema).parse(data);
    },
  });

  return {
    buildingHistory,
  };
};
