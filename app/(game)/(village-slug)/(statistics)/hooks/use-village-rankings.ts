import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useSuspenseQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { coordinatesSchema } from 'app/interfaces/models/common';

const getVillageRankingsSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  coordinates: coordinatesSchema,
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
      const { data } = await fetcher('/statistics/villages', {
        body: {
          lastVillageId: null,
        },
      });

      return z.array(getVillageRankingsSchema).parse(data);
    },
  });

  return {
    rankedVillages,
  };
};
