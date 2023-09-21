import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Quest } from 'interfaces/models/game/quest';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';

const cacheKey = 'quests';

export const useQuests = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateQuests } = useDatabaseMutation({ cacheKey });

  const {
    data: quests,
    isLoading: isLoadingQuests,
    isSuccess: hasLoadedQuests,
    status: questsQueryStatus
  } = useAsyncLiveQuery<Quest[]>({
    queryFn: () => database.quests.where({ serverId }).toArray(),
    deps: [serverId],
    fallback: [],
    cacheKey,
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
