import { useQuery } from '@tanstack/react-query';
import type { Achievement } from 'interfaces/models/game/achievement';

export const achievementsCacheKey = 'achievements';

export const useAchievements = () => {
  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: [achievementsCacheKey],
    initialData: [],
  });

  return {
    achievements,
  };
};
