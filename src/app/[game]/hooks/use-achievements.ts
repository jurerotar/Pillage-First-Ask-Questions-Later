import { useQuery } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import type { Achievement } from 'interfaces/models/game/achievement';
import { getParsedFileContents } from 'app/utils/opfs';

export const achievementsCacheKey = 'achievements';

export const useAchievements = () => {
  const { serverHandle } = useCurrentServer();

  const { data: achievements } = useQuery<Achievement[]>({
    queryFn: () => getParsedFileContents(serverHandle, 'achievements'),
    queryKey: [achievementsCacheKey],
    initialData: [],
  });

  return {
    achievements,
  };
};
