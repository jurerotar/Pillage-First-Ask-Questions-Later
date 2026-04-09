import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { type Quest, questSchema } from '@pillage-first/types/models/quest';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import {
  collectableQuestCountCacheKey,
  currentVillageCacheKey,
  heroCacheKey,
  questsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';

export const useQuests = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: quests } = useSuspenseQuery({
    queryKey: [questsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher(`/villages/${currentVillage.id}/quests`);

      return z.array(questSchema).parse(data);
    },
  });

  const { mutate: completeQuest } = useMutation<
    void,
    Error,
    { questId: Quest['id'] }
  >({
    mutationFn: async ({ questId }) => {
      await fetcher(
        `/villages/${currentVillage.id}/quests/${questId}/collect`,
        {
          method: 'PATCH',
        },
      );
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [questsCacheKey],
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
