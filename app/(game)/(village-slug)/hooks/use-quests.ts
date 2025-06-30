import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import type { Quest } from 'app/interfaces/models/game/quest';
import {
  collectableQuestCountCacheKey,
  heroCacheKey,
  playerVillagesCacheKey,
  questsCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useQuests = () => {
  const { fetcher } = use(ApiContext);
  const queryClient = useQueryClient();

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
          questId,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [questsCacheKey] });
      await queryClient.invalidateQueries({
        queryKey: [collectableQuestCountCacheKey],
      });
      await queryClient.invalidateQueries({
        queryKey: [playerVillagesCacheKey],
      });
      await queryClient.invalidateQueries({ queryKey: [heroCacheKey] });
    },
  });

  return {
    quests,
    collectableQuestCount,
    completeQuest,
  };
};
