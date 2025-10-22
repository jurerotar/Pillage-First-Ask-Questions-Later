import { useSuspenseQuery } from '@tanstack/react-query';
import { collectableQuestCountCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { z } from 'zod';

const getCollectableQuestCountSchema = z.strictObject({
  collectableQuestCount: z.number(),
});

export const useCollectableQuestCount = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: collectableQuestCount } = useSuspenseQuery({
    queryKey: [collectableQuestCountCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher<
        z.infer<typeof getCollectableQuestCountSchema>
      >(`/villages/${currentVillage.id}/quests/collectables/count`);
      return data.collectableQuestCount;
    },
  });

  return {
    collectableQuestCount,
  };
};
