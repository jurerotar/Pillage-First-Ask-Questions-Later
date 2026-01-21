import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { playerSchema } from '@pillage-first/types/models/player';
import { playerRankingsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

const getPlayerRankingsSchema = playerSchema.extend({
  totalPopulation: z.number(),
  villageCount: z.number(),
});

export const usePlayerRankings = () => {
  const { fetcher } = use(ApiContext);

  const { data: rankedPlayers } = useSuspenseQuery({
    queryKey: [playerRankingsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/statistics/players', {
        body: {
          lastPlayerId: null,
        },
      });

      return z.array(getPlayerRankingsSchema).parse(data);
    },
  });

  return {
    rankedPlayers,
  };
};
