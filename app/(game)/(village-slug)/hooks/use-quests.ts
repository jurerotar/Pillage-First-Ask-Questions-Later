import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import type { Quest } from 'app/interfaces/models/game/quest';
import {
  collectableQuestCountCacheKey,
  heroCacheKey,
  playerVillagesCacheKey,
  questsCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { z } from 'zod';

const getQuestsSchema = z.strictObject({
  id: z.string(),
  scope: z.enum(['village', 'global']),
  collectedAt: z.number().nullable(),
  completedAt: z.number().nullable(),
  villageId: z.number().optional(),
});

export const useQuests = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: quests } = useSuspenseQuery({
    queryKey: [questsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher(`/villages/${currentVillage.id}/quests`);

      return z.array(getQuestsSchema).parse(data);
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
    completeQuest,
  };
};
