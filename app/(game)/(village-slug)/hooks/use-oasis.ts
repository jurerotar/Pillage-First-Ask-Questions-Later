import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { Tile } from 'app/interfaces/models/game/tile';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { OccupiableOasisInRangeDTO } from 'app/interfaces/dtos';
import { effectsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

type AbandonOasisArgs = {
  oasisId: Tile['id'];
};

const occupiableOasisInRangeCacheKey = 'occupiable-oasis-in-range';

export const useOasis = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: occupiableOasisInRange } = useSuspenseQuery<
    OccupiableOasisInRangeDTO[]
  >({
    queryKey: [occupiableOasisInRangeCacheKey, currentVillage.tileId],
    queryFn: async () => {
      const { data } = await fetcher<OccupiableOasisInRangeDTO[]>(
        `/tiles/${currentVillage.tileId}/occupiable-oasis`,
      );
      return data;
    },
  });

  const { mutate: abandonOasis } = useMutation<void, Error, AbandonOasisArgs>({
    mutationFn: async ({ oasisId }) => {
      await fetcher(`/villages/${currentVillage.id}/oasis/${oasisId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await context.client.invalidateQueries({
        queryKey: [occupiableOasisInRangeCacheKey],
      });
      await context.client.invalidateQueries({
        queryKey: [effectsCacheKey],
      });
    },
  });

  const { mutate: occupyOasis } = useMutation<void, Error, AbandonOasisArgs>({
    mutationFn: async ({ oasisId }) => {
      await fetcher(`/villages/${currentVillage.id}/oasis/${oasisId}`, {
        method: 'POST',
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await context.client.invalidateQueries({
        queryKey: [occupiableOasisInRangeCacheKey],
      });
      await context.client.invalidateQueries({
        queryKey: [effectsCacheKey],
      });
    },
  });

  return {
    occupiableOasisInRange,
    abandonOasis,
    occupyOasis,
  };
};
