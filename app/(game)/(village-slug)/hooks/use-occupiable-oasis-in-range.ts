import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { Tile } from 'app/interfaces/models/game/tile';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { effectsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { z } from 'zod';

type AbandonOasisArgs = {
  oasisId: Tile['id'];
};

const _getOccupiableOasisInRangeSchema = z.strictObject({
  oasis: z.strictObject({
    id: z.number(),
    coordinates: z.strictObject({
      x: z.number(),
      y: z.number(),
    }),
    bonuses: z.array(
      z.strictObject({
        resource: z.enum(['wood', 'clay', 'iron', 'wheat']),
        bonus: z.number(),
      }),
    ),
  }),
  village: z
    .object({
      id: z.number(),
      coordinates: z.strictObject({
        x: z.number(),
        y: z.number(),
      }),
      name: z.string(),
      slug: z.string(),
    })
    .nullable(),
  player: z
    .object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
    })
    .nullable(),
});

const occupiableOasisInRangeCacheKey = 'occupiable-oasis-in-range';

export const useOccupiableOasisInRange = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: occupiableOasisInRange } = useSuspenseQuery({
    queryKey: [occupiableOasisInRangeCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher<
        z.infer<typeof _getOccupiableOasisInRangeSchema>[]
      >(`/villages/${currentVillage.id}/occupiable-oasis`);
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
