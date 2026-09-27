import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { Unit } from '@pillage-first/types/models/unit';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { villageUnitCountCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const useVillageUnitCount = (unitId: Unit['id']) => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: villageUnitCount } = useSuspenseQuery({
    queryKey: [villageUnitCountCacheKey, currentVillage.id, unitId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/villages/:villageId/units/:unitId/counts',
        {
          path: {
            villageId: currentVillage.id,
            unitId,
          },
        },
      );

      return data;
    },
  });

  return {
    villageUnitCount,
  };
};
