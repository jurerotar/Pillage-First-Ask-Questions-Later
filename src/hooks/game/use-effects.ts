import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Effect } from 'interfaces/models/game/effect';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';

export const useEffects = () => {
  const { serverId } = useCurrentServer();

  const {
    data: effects,
    isLoading: isLoadingEffects,
    isSuccess: hasLoadedEffects,
    status: effectsQueryStatus
  } = useAsyncLiveQuery<Effect[]>(async () => {
    return database.effects.where({ serverId }).toArray();
  }, [serverId], []);

  return {
    effects,
    isLoadingEffects,
    hasLoadedEffects,
    effectsQueryStatus
  };
};
