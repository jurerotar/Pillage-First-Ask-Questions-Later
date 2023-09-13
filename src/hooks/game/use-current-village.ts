import { database } from 'database/database';
import { useRouteSegments } from 'hooks/game/routes/use-route-segments';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { Village } from 'interfaces/models/game/village';

export const useCurrentVillage = () => {
  const { villageSlug } = useRouteSegments();

  console.log({ villageSlug });

  const {
    data: currentVillage,
    isLoading: isLoadingCurrentVillage,
    isSuccess: hasLoadedCurrentVillage,
    status: currentVillageStatus
  } = useAsyncLiveQuery<Village | undefined>(async () => {
    return database.villages.where({ slug: villageSlug }).first();
  }, [villageSlug]);

  return {
    currentVillage,
    isLoadingCurrentVillage,
    hasLoadedCurrentVillage,
    currentVillageStatus
  };
};
