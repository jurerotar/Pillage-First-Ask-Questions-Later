import { useMutation } from '@tanstack/react-query';
import { use } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import {
  currentVillageCacheKey,
  eventsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';

export const useCancelDemolition = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  return useMutation<void, Error>({
    mutationFn: async () => {
      await apiClient.delete('/villages/:villageId/events/demolition', {
        path: {
          villageId: currentVillage.id,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [eventsCacheKey, 'buildingLevelChange', currentVillage.id],
        [currentVillageCacheKey, currentVillage.slug],
      ]);
    },
  });
};
