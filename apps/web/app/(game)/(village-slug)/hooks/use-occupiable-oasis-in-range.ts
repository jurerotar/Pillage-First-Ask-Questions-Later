import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { Tile } from '@pillage-first/types/models/tile';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { effectsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';

type AbandonOasisArgs = {
  oasisId: Tile['id'];
};

const occupiableOasisInRangeCacheKey = 'occupiable-oasis-in-range';

export const useOccupiableOasisInRange = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: occupiableOasisInRange } = useSuspenseQuery({
    queryKey: [occupiableOasisInRangeCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/villages/:villageId/occupiable-oasis',
        {
          path: {
            villageId: currentVillage.id,
          },
        },
      );

      return data;
    },
  });

  const { mutate: abandonOasis } = useMutation<void, Error, AbandonOasisArgs>({
    mutationFn: async ({ oasisId }) => {
      await apiClient.delete('/villages/:villageId/oasis/:oasisId', {
        path: {
          villageId: currentVillage.id,
          oasisId,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [occupiableOasisInRangeCacheKey, currentVillage.id],
        [effectsCacheKey, currentVillage.id],
      ]);
    },
  });

  const { mutate: occupyOasis } = useMutation<void, Error, AbandonOasisArgs>({
    mutationFn: async ({ oasisId }) => {
      await apiClient.post('/villages/:villageId/oasis/:oasisId', {
        path: {
          villageId: currentVillage.id,
          oasisId,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [occupiableOasisInRangeCacheKey, currentVillage.id],
        [effectsCacheKey, currentVillage.id],
      ]);
    },
  });

  return {
    occupiableOasisInRange,
    abandonOasis,
    occupyOasis,
  };
};
