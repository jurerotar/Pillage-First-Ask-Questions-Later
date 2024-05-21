import { useQuery } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { database } from 'database/database';
import type { Quest } from 'interfaces/models/game/quest';
import type { Server } from 'interfaces/models/game/server';

export const questsCacheKey = 'quests';

export const getQuests = (serverId: Server['id']) => database.quests.where({ serverId }).toArray();

export const useQuests = () => {
  const { serverId } = useCurrentServer();
  const { currentVillageId } = useCurrentVillage();

  const { data: quests } = useQuery<Quest[]>({
    queryFn: () => getQuests(serverId),
    queryKey: [questsCacheKey, serverId],
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
