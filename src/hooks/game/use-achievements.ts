import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Achievement } from 'interfaces/models/game/achievement';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';
import { Server } from 'interfaces/models/game/server';

export const achievementsCacheKey = 'achievements';

export const getAchievements = (serverId: Server['id']) => database.achievements.where({ serverId }).toArray();

export const useAchievements = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateAchievements } = useDatabaseMutation({ cacheKey: achievementsCacheKey });

  const {
    data: achievements,
    isLoading: isLoadingAchievements,
    isSuccess: hasLoadedAchievements,
    status: achievementsQueryStatus
  } = useAsyncLiveQuery<Achievement[]>({
    queryFn: () => getAchievements(serverId),
    deps: [serverId],
    fallback: [],
    cacheKey: achievementsCacheKey,
    enabled: hasLoadedServer
  });

  return {
    achievements,
    isLoadingAchievements,
    hasLoadedAchievements,
    achievementsQueryStatus
  };
};
