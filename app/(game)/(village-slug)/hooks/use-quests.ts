import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { Quest, VillageQuest } from 'app/interfaces/models/game/quest';
import { questsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { partition } from 'app/utils/common';
import { isHeroExperienceQuestReward, isQuestCollectable, isResourceQuestReward } from 'app/(game)/workers/guards/quest-guards';
import { updateVillageResources } from 'app/(game)/(village-slug)/hooks/utils/events';
import { addHeroExperience } from 'app/(game)/(village-slug)/hooks/utils/hero';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useQuests = () => {
  const { fetcher } = use(ApiContext);

  const queryClient = useQueryClient();
  const { currentVillage } = useCurrentVillage();

  const { data: quests } = useSuspenseQuery<Quest[]>({
    queryKey: [questsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Quest[]>('/quests');
      return data;
    },
  });

  const [globalQuests, villageQuests] = partition<Quest>(quests, ({ scope }) => scope === 'global') as [Quest[], VillageQuest[]];
  const currentVillageQuests = villageQuests.filter(({ villageId }) => villageId === currentVillage.id);

  const collectableGlobalQuests = globalQuests.filter(isQuestCollectable);
  const collectableCurrentVillageQuests = currentVillageQuests.filter(isQuestCollectable);

  const amountOfUncollectedQuests = collectableGlobalQuests.length + collectableCurrentVillageQuests.length;

  const completeQuest = (questToComplete: Quest) => {
    queryClient.setQueryData<Quest[]>([questsCacheKey], (quests) => {
      return quests!.map((quest) => {
        if (quest.id === questToComplete.id) {
          return {
            ...quest,
            collectedAt: Date.now(),
          };
        }

        return quest;
      });
    });

    for (const reward of questToComplete.rewards) {
      if (isResourceQuestReward(reward)) {
        const { amount } = reward;
        const resourcesToAdd = [amount, amount, amount, amount];
        updateVillageResources(queryClient, currentVillage.id, resourcesToAdd, 'add');
        continue;
      }

      if (isHeroExperienceQuestReward(reward)) {
        addHeroExperience(queryClient, reward.amount);
      }
    }
  };

  return {
    quests,
    globalQuests,
    currentVillageQuests,
    amountOfUncollectedQuests,
    completeQuest,
  };
};
