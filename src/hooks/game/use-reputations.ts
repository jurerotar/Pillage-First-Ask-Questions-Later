import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';
import { Server } from 'interfaces/models/game/server';
import { Reputation } from 'interfaces/models/game/reputation';
import { PlayerFaction } from 'interfaces/models/game/player';

export const reputationsCacheKey = 'reputations';

export const getReputations = (serverId: Server['id']) => database.reputations.where({ serverId }).toArray();

export const useReputations = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateReputations } = useDatabaseMutation({ cacheKey: reputationsCacheKey });

  const {
    data: reputations,
    isLoading: isLoadingReputations,
    isSuccess: hasLoadedReputations,
    status: reputationsQueryStatus
  } = useAsyncLiveQuery<Reputation[]>({
    queryFn: () => getReputations(serverId),
    deps: [serverId],
    fallback: [],
    cacheKey: reputationsCacheKey,
    enabled: hasLoadedServer
  });

  const getReputationByFaction = (faction: PlayerFaction): Reputation => {
    return reputations.find(({ faction: reputationFaction }) => faction === reputationFaction)!;
  };

  return {
    reputations,
    isLoadingReputations,
    hasLoadedReputations,
    reputationsQueryStatus,
    mutateReputations,
    getReputationByFaction
  };
};
