import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useSuspenseQuery } from '@tanstack/react-query';
import { z } from 'zod';
import type { Player } from 'app/interfaces/models/game/player';

const _getPlayerRankingsSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  tribe: z.string().brand<Player['tribe']>(),
  factionId: z.string().brand<Player['faction']>(),
  totalPopulation: z.number(),
  villageCount: z.number(),
});

export const usePlayerRankings = () => {
  const { fetcher } = use(ApiContext);

  const { data: rankedPlayers } = useSuspenseQuery({
    queryKey: ['player-rankings'],
    queryFn: async () => {
      const { data } = await fetcher<
        z.infer<typeof _getPlayerRankingsSchema>[]
      >('/statistics/players', {
        body: {
          lastPlayerId: null,
        },
      });
      return data;
    },
  });

  return {
    rankedPlayers,
  };
};
