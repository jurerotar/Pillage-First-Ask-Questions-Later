import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Achievement } from 'interfaces/models/game/achievement';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';

const cacheKey = 'achievements';

export const useAchievements = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateAchievements } = useDatabaseMutation({ cacheKey });

  const {
    data: achievements,
    isLoading: isLoadingAchievements,
    isSuccess: hasLoadedAchievements,
    status: achievementsQueryStatus
  } = useAsyncLiveQuery<Achievement[]>({
    queryFn: () => database.achievements.where({ serverId }).toArray(),
    deps: [serverId],
    fallback: [],
    cacheKey,
    enabled: hasLoadedServer
  });

  return {
    achievements,
    isLoadingAchievements,
    hasLoadedAchievements,
    achievementsQueryStatus
  };
};
