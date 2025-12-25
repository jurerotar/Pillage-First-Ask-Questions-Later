import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import {
  collectableQuestCountCacheKey,
  heroCacheKey,
  playerVillagesCacheKey,
  questsCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { Quest } from 'app/interfaces/models/game/quest';

export const useQuests = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: quests } = useSuspenseQuery<Quest[]>({
    queryKey: [questsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Quest[]>('/me/quests');
      return data;
    },
  });

  const { data: collectableQuestCount } = useSuspenseQuery<number>({
    queryKey: [collectableQuestCountCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<{ collectableQuestCount: number }>(
        '/me/quests/collectables/count',
      );
      return data.collectableQuestCount;
    },
  });

  const { mutate: completeQuest } = useMutation<
    void,
    Error,
    { questId: Quest['id'] }
  >({
    mutationFn: async ({ questId }) => {
      await fetcher(`/quests/${questId}/collect`, {
        method: 'PATCH',
        body: {
          villageId: currentVillage.id,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await context.client.invalidateQueries({ queryKey: [questsCacheKey] });
      await context.client.invalidateQueries({
        queryKey: [collectableQuestCountCacheKey],
      });
      await context.client.invalidateQueries({
        queryKey: [playerVillagesCacheKey],
      });
      await context.client.invalidateQueries({ queryKey: [heroCacheKey] });
    },
  });

  return {
    quests,
    collectableQuestCount,
    completeQuest,
  };
};
