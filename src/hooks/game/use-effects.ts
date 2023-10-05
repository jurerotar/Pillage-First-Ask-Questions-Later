import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Effect } from 'interfaces/models/game/effect';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';
import { Server } from 'interfaces/models/game/server';

export const effectsCacheKey = 'effects';

export const getEffects = (serverId: Server['id']) => database.effects.where({ serverId }).toArray();

export const useEffects = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateEffects } = useDatabaseMutation({ cacheKey: effectsCacheKey });

  const {
    data: effects,
    isLoading: isLoadingEffects,
    isSuccess: hasLoadedEffects,
    status: effectsQueryStatus
  } = useAsyncLiveQuery<Effect[]>({
    queryFn: () => getEffects(serverId),
    deps: [serverId],
    fallback: [],
    cacheKey: effectsCacheKey,
    enabled: hasLoadedServer
  });

  return {
    effects,
    isLoadingEffects,
    hasLoadedEffects,
    effectsQueryStatus
  };
};
