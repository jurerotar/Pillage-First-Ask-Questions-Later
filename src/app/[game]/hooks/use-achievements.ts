import { useQuery } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { database } from 'database/database';
import type { Achievement } from 'interfaces/models/game/achievement';
import type { Server } from 'interfaces/models/game/server';

export const achievementsCacheKey = 'achievements';

export const getAchievements = (serverId: Server['id']) => database.achievements.where({ serverId }).toArray();

export const useAchievements = () => {
  const { serverId } = useCurrentServer();

  const { data: achievements } = useQuery<Achievement[]>({
    queryFn: () => getAchievements(serverId),
    queryKey: [achievementsCacheKey, serverId],
    initialData: [],
  });

  return {
    achievements,
  };
};
