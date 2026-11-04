import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { Quest } from '@pillage-first/types/models/quest';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import {
  collectableQuestCountCacheKey,
  currentVillageCacheKey,
  heroCacheKey,
  questsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';
import { invalidateQueries } from 'app/utils/react-query';

export const useQuests = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: quests } = useSuspenseQuery({
    queryKey: [questsCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/me/quests', {
        query: {
          villageId: currentVillage.id,
        },
      });

      return data;
    },
  });

  const { mutate: completeQuest } = useMutation<
    void,
    Error,
    { questId: Quest['id'] }
  >({
    mutationFn: async ({ questId }) => {
      await apiClient.post('/me/quests/:questId/collect', {
        body: { villageId: currentVillage.id },
        path: {
          questId,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [questsCacheKey, currentVillage.id],
        [collectableQuestCountCacheKey],
        [currentVillageCacheKey],
        [heroCacheKey],
      ]);
    },
  });

  return {
    quests,
    completeQuest,
  };
};
