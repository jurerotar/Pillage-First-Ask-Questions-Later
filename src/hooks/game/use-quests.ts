import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Quest } from 'interfaces/models/game/quest';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';

export const useQuests = () => {
  const { serverId } = useCurrentServer();

  const {
    data: quests,
    isLoading: isLoadingQuests,
    isSuccess: hasLoadedQuests,
    status: questsQueryStatus
  } = useAsyncLiveQuery<Quest[]>(async () => {
    return database.quests.where({ serverId }).toArray();
  }, [serverId], []);

  const completedQuests = quests.filter((quest: Quest) => true);

  return {
    quests,
    isLoadingQuests,
    hasLoadedQuests,
    questsQueryStatus
  };
};
