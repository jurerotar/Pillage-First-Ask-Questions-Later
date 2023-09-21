import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Effect } from 'interfaces/models/game/effect';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';

const cacheKey = 'effects';

export const useEffects = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateEffects } = useDatabaseMutation({ cacheKey });

  const {
    data: effects,
    isLoading: isLoadingEffects,
    isSuccess: hasLoadedEffects,
    status: effectsQueryStatus
  } = useAsyncLiveQuery<Effect[]>({
    queryFn: () => database.effects.where({ serverId }).toArray(),
    deps: [serverId],
    fallback: [],
    cacheKey,
    enabled: hasLoadedServer
  });

  return {
    effects,
    isLoadingEffects,
    hasLoadedEffects,
    effectsQueryStatus
  };
};
