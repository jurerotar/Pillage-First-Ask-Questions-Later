import type { ApiHandler } from 'app/interfaces/api';
import { questsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Quest } from 'app/interfaces/models/game/quest';
import { isHeroExperienceQuestReward, isQuestCollectable, isResourceQuestReward } from 'app/(game)/guards/quest-guards';
import { addVillageResourcesAt } from 'app/(game)/api/utils/village';
import { addHeroExperience } from 'app/(game)/api/handlers/utils/hero';

export const getQuests: ApiHandler<Quest[]> = async (queryClient) => {
  return queryClient.getQueryData<Quest[]>([questsCacheKey])!;
};

type GetCollectableQuestCountReturn = {
  collectableQuestCount: number;
};

export const getCollectableQuestCount: ApiHandler<GetCollectableQuestCountReturn> = async (queryClient) => {
  const quests = queryClient.getQueryData<Quest[]>([questsCacheKey])!;

  return {
    collectableQuestCount: quests.filter(isQuestCollectable).length,
  };
};

export const collectQuest: ApiHandler<void, 'questId', void> = async (queryClient, args) => {
  const {
    params: { questId },
  } = args;

  const quests = queryClient.getQueryData<Quest[]>([questsCacheKey])!;
  const quest = quests.find(({ id }) => id === questId)!;
  const [villageIdString] = quest.id.split('-');
  const villageId = Number.parseInt(villageIdString);

  quest.collectedAt = Date.now();

  for (const reward of quest.rewards) {
    if (isResourceQuestReward(reward)) {
      const { amount } = reward;
      const resourcesToAdd = {
        wood: amount,
        clay: amount,
        iron: amount,
        wheat: amount,
      };

      addVillageResourcesAt(queryClient, villageId, Date.now(), resourcesToAdd);
      continue;
    }

    if (isHeroExperienceQuestReward(reward)) {
      addHeroExperience(queryClient, reward.amount);
    }
  }

  queryClient.setQueryData<Quest[]>([questsCacheKey], () => {
    return quests;
  });
};
