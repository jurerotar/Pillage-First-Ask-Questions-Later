import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { coordinatesSchema } from '@pillage-first/types/models/coordinates';
import { villageRankingsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

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
    queryKey: [villageRankingsCacheKey],
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
