import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Village } from 'interfaces/models/game/village';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';

export const useVillages = () => {
  const { serverId } = useCurrentServer();

  const {
    data: villages,
    isLoading: isLoadingVillages,
    isSuccess: hasLoadedVillages,
    status: villagesQueryStatus
  } = useAsyncLiveQuery<Village[]>(async () => {
    return database.villages.where({ serverId }).toArray();
  }, [serverId], []);

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
