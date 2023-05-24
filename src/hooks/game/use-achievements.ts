import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Achievement } from 'interfaces/models/game/achievement';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';

export const useAchievements = () => {
  const { serverId } = useCurrentServer();

  const {
    data: achievements,
    isLoading: isLoadingAchievements,
    isSuccess: hasLoadedAchievements,
    status: achievementsQueryStatus
  } = useAsyncLiveQuery<Achievement[]>(async () => {
    return database.achievements.where({ serverId }).toArray();
  }, [serverId], []);

  return {
    achievements,
    isLoadingAchievements,
    hasLoadedAchievements,
    achievementsQueryStatus
  };
};
