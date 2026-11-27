import { useSuspenseQuery } from '@tanstack/react-query';
import { use, useSyncExternalStore } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { villageCelebrationCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';
import { getCurrentTime, subscribeToTimer } from 'app/(game)/utils/timer';

export const useActiveCelebration = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: celebration } = useSuspenseQuery({
    queryKey: [villageCelebrationCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/villages/:villageId/celebration', {
        path: { villageId: currentVillage.id },
      });

      return data;
    },
  });

  return useSyncExternalStore(subscribeToTimer, () =>
    celebration && celebration.endsAt > getCurrentTime() ? celebration : null,
  );
};
