import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { collectableQuestCountCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useCollectableQuestCount = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: collectableQuestCount } = useSuspenseQuery({
    queryKey: [collectableQuestCountCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/villages/:villageId/quests/collectables/count',
        {
          path: {
            villageId: currentVillage.id,
          },
        },
      );

      return data.collectableQuestCount;
    },
  });

  return {
    collectableQuestCount,
  };
};
