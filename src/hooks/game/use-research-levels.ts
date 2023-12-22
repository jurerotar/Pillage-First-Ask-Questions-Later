import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { ResearchLevel } from 'interfaces/models/game/research-level';
import { useQuery } from '@tanstack/react-query';
import { Server } from 'interfaces/models/game/server';

export const researchLevelsCacheKey = 'research-levels';

export const getResearchLevels = (serverId: Server['id']) => database.researchLevels.where({ serverId }).toArray();

export const useResearchLevels = () => {
  const { serverId } = useCurrentServer();

  const {
    data: researchLevels,
    isLoading: isLoadingResearchLevels,
    isSuccess: hasLoadedResearchLevels,
    status: researchLevelsQueryStatus,
  } = useQuery<ResearchLevel[]>({
    queryFn: () => getResearchLevels(serverId),
    queryKey: [researchLevelsCacheKey, serverId],
    initialData: [],
  });

  return {
    researchLevels,
    isLoadingResearchLevels,
    hasLoadedResearchLevels,
    researchLevelsQueryStatus,
  };
};
