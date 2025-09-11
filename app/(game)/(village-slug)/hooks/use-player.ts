import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { Player } from 'app/interfaces/models/game/player';
import { playersCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { z } from 'zod';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';

const _getPlayerSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  tribe: z.enum([
    'romans',
    'teutons',
    'gauls',
    'huns',
    'egyptians',
  ] satisfies PlayableTribe[]),
});

export const usePlayer = () => {
  const { fetcher } = use(ApiContext);

  const { data: player } = useSuspenseQuery<Player>({
    queryKey: [playersCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Player>('/me');
      return data;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  return {
    player,
  };
};
