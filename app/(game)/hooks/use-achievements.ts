import { useQuery } from '@tanstack/react-query';
import type { Achievement } from 'app/interfaces/models/game/achievement';
import { achievementsCacheKey } from 'app/query-keys';

export const useAchievements = () => {
  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: [achievementsCacheKey],
    initialData: [],
  });

  return {
    achievements,
  };
};
