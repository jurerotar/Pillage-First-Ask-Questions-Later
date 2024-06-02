import { useQuery } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import type { Quest } from 'interfaces/models/game/quest';
import { getParsedFileContents } from 'app/utils/opfs';

export const questsCacheKey = 'quests';

export const useQuests = () => {
  const { serverHandle } = useCurrentServer();
  const { currentVillageId } = useCurrentVillage();

  const { data: quests } = useQuery<Quest[]>({
    queryFn: () => getParsedFileContents(serverHandle, 'quests'),
    queryKey: [questsCacheKey],
    initialData: [],
  });

  const globalQuests = quests.filter(({ scope }) => scope === 'global');
  const currentVillageQuests = quests.filter(({ villageId }) => villageId === currentVillageId);

  return {
    quests,
    globalQuests,
    currentVillageQuests,
  };
};
