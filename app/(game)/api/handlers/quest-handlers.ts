import type { ApiHandler } from 'app/interfaces/api';
import { questsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Quest } from 'app/interfaces/models/game/quest';
import {
  isHeroExperienceQuestReward,
  isQuestCollectable,
  isResourceQuestReward,
  isVillageQuest,
} from 'app/(game)/guards/quest-guards';
import { addVillageResourcesAt } from 'app/(game)/api/utils/village';
import { addHeroExperience } from 'app/(game)/api/handlers/utils/hero';
import type { Village } from 'app/interfaces/models/game/village';
import { getQuestRewards } from 'app/assets/utils/quests';

export const getQuests: ApiHandler<Quest[]> = async (queryClient) => {
  return queryClient.getQueryData<Quest[]>([questsCacheKey])!;
};

type GetCollectableQuestCountReturn = {
  collectableQuestCount: number;
};

export const getCollectableQuestCount: ApiHandler<
  GetCollectableQuestCountReturn
> = async (queryClient, _database) => {
  const quests = queryClient.getQueryData<Quest[]>([questsCacheKey])!;

  return {
    collectableQuestCount: quests.filter(isQuestCollectable).length,
  };
};

export const collectQuest: ApiHandler<
  void,
  'questId',
  { villageId: Village['id'] }
> = async (queryClient, database, args) => {
  const {
    params: { questId },
    body: { villageId },
  } = args;

  const quests = queryClient.getQueryData<Quest[]>([questsCacheKey])!;

  const quest = quests.find((quest) => {
    if (quest.id !== questId) {
      return false;
    }

    if (isVillageQuest(quest)) {
      return quest.villageId === villageId;
    }

    return true;
  })!;

  quest.collectedAt = Date.now();

  const questRewards = getQuestRewards(quest.id);

  for (const reward of questRewards) {
    if (isResourceQuestReward(reward)) {
      const { amount } = reward;

      addVillageResourcesAt(queryClient, database, villageId, Date.now(), [
        amount,
        amount,
        amount,
        amount,
      ]);
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
