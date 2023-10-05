import { database } from 'database/database';
import { useRouteSegments } from 'hooks/game/routes/use-route-segments';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { Village } from 'interfaces/models/game/village';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';
import { Server } from 'interfaces/models/game/server';
import { useCurrentServer } from 'hooks/game/use-current-server';

export const currentVillageCacheKey = 'current-village';

export const getCurrentVillage = (serverId: Server['id'], villageSlug: string) => {
  return database.villages.where({ serverId, slug: villageSlug })
    .first();
};

export const useCurrentVillage = () => {
  const { serverId } = useCurrentServer();
  const { villageSlug } = useRouteSegments();
  const { mutate: mutateCurrentVillage } = useDatabaseMutation({ cacheKey: currentVillageCacheKey });

  const {
    data: currentVillage,
    isLoading: isLoadingCurrentVillage,
    isSuccess: hasLoadedCurrentVillage,
    status: currentVillageStatus
  } = useAsyncLiveQuery<Village | undefined>({
    queryFn: () => getCurrentVillage(serverId, villageSlug),
    deps: [villageSlug, serverId],
    cacheKey: currentVillageCacheKey
  });

  return {
    currentVillage,
    isLoadingCurrentVillage,
    hasLoadedCurrentVillage,
    currentVillageStatus
  };
};
