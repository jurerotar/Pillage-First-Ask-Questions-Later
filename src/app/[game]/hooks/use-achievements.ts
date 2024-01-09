import { database } from 'database/database';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { Achievement } from 'interfaces/models/game/achievement';
import { useQuery } from '@tanstack/react-query';
import { Server } from 'interfaces/models/game/server';

export const achievementsCacheKey = 'achievements';

export const getAchievements = (serverId: Server['id']) => database.achievements.where({ serverId }).toArray();

export const useAchievements = () => {
  const { serverId } = useCurrentServer();

  const {
    data: achievements,
    isLoading: isLoadingAchievements,
    isSuccess: hasLoadedAchievements,
    status: achievementsQueryStatus,
  } = useQuery<Achievement[]>({
    queryFn: () => getAchievements(serverId),
    queryKey: [achievementsCacheKey, serverId],
    initialData: [],
  });

  return {
    achievements,
    isLoadingAchievements,
    hasLoadedAchievements,
    achievementsQueryStatus,
  };
};
