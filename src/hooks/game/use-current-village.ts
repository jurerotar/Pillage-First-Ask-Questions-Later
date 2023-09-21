import { database } from 'database/database';
import { useRouteSegments } from 'hooks/game/routes/use-route-segments';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { Village } from 'interfaces/models/game/village';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';

const cacheKey = 'current-village';

export const useCurrentVillage = () => {
  const { villageSlug } = useRouteSegments();
  const { mutate: mutateCurrentVillage } = useDatabaseMutation({ cacheKey });

  const {
    data: currentVillage,
    isLoading: isLoadingCurrentVillage,
    isSuccess: hasLoadedCurrentVillage,
    status: currentVillageStatus
  } = useAsyncLiveQuery<Village | undefined>({
    queryFn: () => database.villages.where({ slug: villageSlug }).first(),
    deps: [villageSlug],
    cacheKey
  });

  return {
    currentVillage,
    isLoadingCurrentVillage,
    hasLoadedCurrentVillage,
    currentVillageStatus
  };
};
