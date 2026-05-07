import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { troopMovementsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useVillageTroopMovements = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: troopMovements } = useSuspenseQuery({
    queryKey: [troopMovementsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/villages/:villageId/troop-movements',
        {
          path: {
            villageId: currentVillage.id,
          },
        },
      );

      return data;
    },
  });

  return {
    troopMovements,
  };
};
