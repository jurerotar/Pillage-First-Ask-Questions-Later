import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { ResearchLevel } from 'interfaces/models/game/research-level';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';

export const useResearchLevels = () => {
  const { serverId } = useCurrentServer();

  const {
    data: researchLevels,
    isLoading: isLoadingResearchLevels,
    isSuccess: hasLoadedResearchLevels,
    status: researchLevelsQueryStatus
  } = useAsyncLiveQuery<ResearchLevel | undefined>(async () => {
    return database.researchLevels.where({ serverId }).first();
  }, [serverId]);

  return {
    researchLevels,
    isLoadingResearchLevels,
    hasLoadedResearchLevels,
    researchLevelsQueryStatus
  };
};
