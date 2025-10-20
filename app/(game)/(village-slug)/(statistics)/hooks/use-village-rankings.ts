import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useSuspenseQuery } from '@tanstack/react-query';
import { z } from 'zod';

const _getVillageRankingsSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  coordinates: z.strictObject({
    x: z.number(),
    y: z.number(),
  }),
  population: z.number(),
  playerId: z.number(),
  playerName: z.string(),
  playerSlug: z.string(),
});

export const useVillageRankings = () => {
  const { fetcher } = use(ApiContext);

  const { data: rankedVillages } = useSuspenseQuery({
    queryKey: ['player-villages'],
    queryFn: async () => {
      const { data } = await fetcher<
        z.infer<typeof _getVillageRankingsSchema>[]
      >('/statistics/villages', {
        body: {
          lastVillageId: null,
        },
      });
      return data;
    },
  });

  return {
    rankedVillages,
  };
};
