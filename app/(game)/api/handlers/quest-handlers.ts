import type { ApiHandler } from 'app/interfaces/api';
import { questsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Quest } from 'app/interfaces/models/game/quest';
import { isQuestCollectable } from 'app/(game)/workers/guards/quest-guards';

export const getQuests: ApiHandler<Quest[]> = async (queryClient) => {
  return queryClient.getQueryData<Quest[]>([questsCacheKey])!;
};

type GetCollectableQuestCountReturn = {
  collectableQuestCount: number;
};

export const getCollectableQuestCount: ApiHandler<GetCollectableQuestCountReturn> = async (queryClient, args) => {
  const quests = await getQuests(queryClient, args);

  return {
    collectableQuestCount: quests.filter(isQuestCollectable).length,
  };
};

type CollectQuestParams = {
  questId: Quest['id'];
};

export const collectQuest: ApiHandler<void, CollectQuestParams, void> = async (queryClient, args) => {
  const { params: { questId }} = args;
  return;
};

