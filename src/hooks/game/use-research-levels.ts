import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { ResearchLevel } from 'interfaces/models/game/research-level';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';
import { useTribe } from 'hooks/game/use-tribe';

const cacheKey = 'research-levels';

export const useResearchLevels = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateResearchLevels } = useDatabaseMutation({ cacheKey });
  const { tribe } = useTribe();

  const {
    data: researchLevels,
    isLoading: isLoadingResearchLevels,
    isSuccess: hasLoadedResearchLevels,
    status: researchLevelsQueryStatus
  } = useAsyncLiveQuery<ResearchLevel[]>({
    queryFn: () => database.researchLevels.where({ serverId }).toArray(),
    deps: [serverId],
    fallback: [],
    cacheKey,
    enabled: hasLoadedServer
  });

  return {
    researchLevels,
    isLoadingResearchLevels,
    hasLoadedResearchLevels,
    researchLevelsQueryStatus
  };
};
