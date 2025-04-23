import { useQuery } from '@tanstack/react-query';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { Quest, VillageQuest } from 'app/interfaces/models/game/quest';
import { questsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { partition } from 'app/utils/common';
import { isQuestCollectable } from 'app/(game)/workers/guards/quest-guards';

export const useQuests = () => {
  const { currentVillage } = useCurrentVillage();

  const { data: quests } = useQuery<Quest[]>({
    queryKey: [questsCacheKey],
    initialData: [],
  });

  const [globalQuests, villageQuests] = partition<Quest>(quests, ({ scope }) => scope === 'global') as [Quest[], VillageQuest[]];
  const currentVillageQuests = (villageQuests).filter(({ villageId }) => villageId === currentVillage.id);

  const collectableGlobalQuests = globalQuests.filter(isQuestCollectable);
  const collectableCurrentVillageQuests = currentVillageQuests.filter(isQuestCollectable);

  const amountOfUncollectedQuests = collectableGlobalQuests.length + collectableCurrentVillageQuests.length;

  return {
    quests,
    globalQuests,
    currentVillageQuests,
    amountOfUncollectedQuests,
  };
};
