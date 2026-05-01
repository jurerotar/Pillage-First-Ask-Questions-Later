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
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  return useMutation<void, Error>({
    mutationFn: async () => {
      await fetcher(`/villages/${currentVillage.id}/events/demolition`, {
        method: 'DELETE',
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
