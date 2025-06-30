import { useSuspenseQuery } from '@tanstack/react-query';
import type { Player } from 'app/interfaces/models/game/player';
import { playersCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const usePlayers = () => {
  const { fetcher } = use(ApiContext);

  const { data: players } = useSuspenseQuery<Player[]>({
    queryKey: [playersCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Player[]>('/players');
      return data;
    },
  });

  return {
    players,
  };
};
