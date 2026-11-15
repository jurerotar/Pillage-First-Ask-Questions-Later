import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { CurrentVillageComputedEffectsContext } from 'app/(game)/(village-slug)/providers/current-village-computed-effects-context';
import { currentVillageCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const useVillageStorage = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const effects = use(CurrentVillageComputedEffectsContext);

  const { data: storage } = useSuspenseQuery({
    queryKey: [currentVillageCacheKey, currentVillage.slug, 'storage', effects],
    queryFn: async () => {
      const { data } = await apiClient.get('/villages/:villageId/storage', {
        path: { villageId: currentVillage.id },
      });
      return data;
    },
  });

  return { storage };
};
