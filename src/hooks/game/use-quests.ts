import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Quest } from 'interfaces/models/game/quest';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';
import { Server } from 'interfaces/models/game/server';

export const questsCacheKey = 'quests';

export const getQuests = (serverId: Server['id']) => database.quests.where({ serverId }).toArray();

export const useQuests = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateQuests } = useDatabaseMutation({ cacheKey: questsCacheKey });

  const {
    data: quests,
    isLoading: isLoadingQuests,
    isSuccess: hasLoadedQuests,
    status: questsQueryStatus
  } = useAsyncLiveQuery<Quest[]>({
    queryFn: () => getQuests(serverId),
    deps: [serverId],
    fallback: [],
    cacheKey: questsCacheKey,
    enabled: hasLoadedServer
  });

  const completedQuests = quests.filter((quest: Quest) => true);

  return {
    quests,
    isLoadingQuests,
    hasLoadedQuests,
    questsQueryStatus
  };
};
