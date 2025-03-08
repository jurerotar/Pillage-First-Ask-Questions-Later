import { useQuery } from '@tanstack/react-query';
import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import type { Quest } from 'app/interfaces/models/game/quest';
import { questsCacheKey } from 'app/(game)/constants/query-keys';
import { use } from 'react';

export const useQuests = () => {
  const { currentVillage } = use(CurrentVillageContext);

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
