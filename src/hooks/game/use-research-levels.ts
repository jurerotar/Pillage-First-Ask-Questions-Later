import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { ResearchLevel } from 'interfaces/models/game/research-level';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';
import { useTribe } from 'hooks/game/use-tribe';
import { Server } from 'interfaces/models/game/server';

export const researchLevelsCacheKey = 'research-levels';

export const getResearchLevels = (serverId: Server['id']) => database.researchLevels.where({ serverId }).toArray();

export const useResearchLevels = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateResearchLevels } = useDatabaseMutation({ cacheKey: researchLevelsCacheKey });
  const { tribe } = useTribe();

  const {
    data: researchLevels,
    isLoading: isLoadingResearchLevels,
    isSuccess: hasLoadedResearchLevels,
    status: researchLevelsQueryStatus
  } = useAsyncLiveQuery<ResearchLevel[]>({
    queryFn: () => getResearchLevels(serverId),
    deps: [serverId],
    fallback: [],
    cacheKey: researchLevelsCacheKey,
    enabled: hasLoadedServer
  });

  return {
    researchLevels,
    isLoadingResearchLevels,
    hasLoadedResearchLevels,
    researchLevelsQueryStatus
  };
};
