import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { factionSchema } from 'app/interfaces/models/game/faction';
import { tribeSchema } from 'app/interfaces/models/game/tribe';

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
