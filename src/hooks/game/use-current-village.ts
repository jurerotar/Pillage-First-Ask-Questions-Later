import { database } from 'database/database';
import { useRouteSegments } from 'hooks/game/routes/use-route-segments';
import { useQuery } from '@tanstack/react-query';
import { Village } from 'interfaces/models/game/village';
import { Server } from 'interfaces/models/game/server';
import { useCurrentServer } from 'hooks/game/use-current-server';

export const currentVillageCacheKey = 'current-village';

export const getCurrentVillage = (serverId: Server['id'], villageSlug: string) => {
  return (database.villages.where({ serverId, slug: villageSlug })
    .first() as Promise<Village>);
};

export const useCurrentVillage = () => {
  const { serverId } = useCurrentServer();
  const { villageSlug } = useRouteSegments();

  const {
    data,
    isLoading: isLoadingCurrentVillage,
    isSuccess: hasLoadedCurrentVillage,
    status: currentVillageStatus,
  } = useQuery<Village>({
    queryFn: () => getCurrentVillage(serverId, villageSlug),
    queryKey: [currentVillageCacheKey, serverId, villageSlug],
  });

  // Due to us working with only local data, which is prefetched in loader, we can do this assertion to save us from having to spam "!" everywhere
  const currentVillage = data as Village;

  const currentVillageId = currentVillage!.id;

  return {
    currentVillage: currentVillage!,
    isLoadingCurrentVillage,
    hasLoadedCurrentVillage,
    currentVillageStatus,
    currentVillageId,
  };
};
