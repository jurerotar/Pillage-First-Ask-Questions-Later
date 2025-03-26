import { useQuery } from '@tanstack/react-query';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { Quest } from 'app/interfaces/models/game/quest';
import { questsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const useQuests = () => {
  const { currentVillage } = useCurrentVillage();

  const { data: quests } = useQuery<Quest[]>({
    queryKey: [questsCacheKey],
    initialData: [],
  });

  const globalQuests = quests.filter(({ scope }) => scope === 'global');
  const currentVillageQuests = quests.filter(({ villageId }) => villageId === currentVillage.id);

  return {
    quests,
    globalQuests,
    currentVillageQuests,
  };
};
