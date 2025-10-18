import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useSuspenseQuery } from '@tanstack/react-query';
import { z } from 'zod';
import type { Player } from 'app/interfaces/models/game/player';

const _getPlayerStatisticsSchema = z.strictObject({
  faction_id: z.string().brand<Player['faction']>(),
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  total_population: z.number(),
  tribe: z.string().brand<Player['tribe']>(),
  village_count: z.number(),
});

export const usePlayerStatistics = () => {
  const { fetcher } = use(ApiContext);

  const { data: playerStatistics } = useSuspenseQuery({
    queryKey: ['burek'],
    queryFn: async () => {
      const { data } = await fetcher('/statistics/players', {
        body: {
          lastPlayerId: null,
        },
      });
      return data;
    },
  });

  return {
    playerStatistics,
  };
};
