import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Village } from 'interfaces/models/game/village';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';
import { Server } from 'interfaces/models/game/server';

export const villagesCacheKey = 'villages';

export const getVillages = (serverId: Server['id']) => database.villages.where({ serverId }).toArray();

export const useVillages = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateVillages } = useDatabaseMutation({ cacheKey: villagesCacheKey });

  const {
    data: villages,
    isLoading: isLoadingVillages,
    isSuccess: hasLoadedVillages,
    status: villagesQueryStatus
  } = useAsyncLiveQuery<Village[]>({
    queryFn: () => getVillages(serverId),
    deps: [serverId],
    fallback: [],
    cacheKey: villagesCacheKey,
    enabled: hasLoadedServer
  });

  const playerVillages: Village[] = villages?.filter((village: Village) => true);
  const npcVillages: Village[] = villages?.filter((village: Village) => true);

  return {
    villages,
    isLoadingVillages,
    hasLoadedVillages,
    villagesQueryStatus,
    playerVillages,
    npcVillages
  };
};
