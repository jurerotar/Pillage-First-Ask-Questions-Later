import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { factionSchema } from '@pillage-first/types/models/faction';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { ApiContext } from 'app/(game)/providers/api-provider';

const gameWorldOverviewStatisticsSchema = z.object({
  playerCount: z.number(),
  villageCount: z.number(),
  playersByTribe: z.record(tribeSchema, z.number()),
  playersByFaction: z.record(factionSchema, z.number()),
  villagesByTribe: z.record(tribeSchema, z.number()),
  villagesByFaction: z.record(factionSchema, z.number()),
});

export const useGameWorldOverview = () => {
  const { fetcher } = use(ApiContext);

  const { data: gameWorldOverviewStatistics } = useSuspenseQuery({
    queryKey: ['game-world-overview-statistics'],
    queryFn: async () => {
      const { data } = await fetcher('/statistics/overview', {
        method: 'GET',
      });

      return gameWorldOverviewStatisticsSchema.parse(data);
    },
  });

  return {
    gameWorldOverviewStatistics,
  };
};
