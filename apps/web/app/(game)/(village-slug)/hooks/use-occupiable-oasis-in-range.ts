import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { Tile } from '@pillage-first/types/models/tile';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { effectsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';
import { invalidateQueries } from 'app/utils/react-query';

type AbandonOasisArgs = {
  oasisTileId: Tile['id'];
};

const occupiableOasisInRangeCacheKey = 'occupiable-oasis-in-range';

export const useOccupiableOasisInRange = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: occupiableOasisInRange } = useSuspenseQuery({
    queryKey: [occupiableOasisInRangeCacheKey, currentVillage.tileId],
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
    mutationFn: async ({ oasisTileId }) => {
      await apiClient.delete('/tiles/:tileId/oasis/:oasisTileId', {
        path: {
          tileId: currentVillage.tileId,
          oasisTileId,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [occupiableOasisInRangeCacheKey, currentVillage.tileId],
        [effectsCacheKey, currentVillage.tileId],
      ]);
    },
  });

  const { mutate: occupyOasis } = useMutation<void, Error, AbandonOasisArgs>({
    mutationFn: async ({ oasisTileId }) => {
      await apiClient.post('/tiles/:tileId/oasis/:oasisTileId', {
        path: {
          tileId: currentVillage.tileId,
          oasisTileId,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [occupiableOasisInRangeCacheKey, currentVillage.tileId],
        [effectsCacheKey, currentVillage.tileId],
      ]);
    },
  });

  return {
    occupiableOasisInRange,
    abandonOasis,
    occupyOasis,
  };
};
