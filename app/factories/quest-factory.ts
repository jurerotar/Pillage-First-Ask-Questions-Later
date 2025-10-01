import { globalQuests, villageQuests } from 'app/assets/quests';
import type { Quest, VillageQuest } from 'app/interfaces/models/game/quest';
import type { Village } from 'app/interfaces/models/game/village';

export const newVillageQuestsFactory = (
  villageId: Village['id'],
): VillageQuest[] => {
  const questsWithVillageId = villageQuests.map((quest) => ({
    ...quest,
    villageId,
  }));

  return questsWithVillageId.map((quest) => ({
    ...quest,
    collectedAt: null,
    completedAt: null,
  }));
};

export const generateNewServerQuests = (villageId: Village['id']): Quest[] => {
  const collectableGlobalQuests = globalQuests.map((quest) => ({
    ...quest,
    collectedAt: null,
    completedAt: null,
  }));

  const collectableVillageQuests = newVillageQuestsFactory(villageId);

  return [...collectableGlobalQuests, ...collectableVillageQuests];
};
