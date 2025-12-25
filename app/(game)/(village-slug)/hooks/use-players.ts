import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { playersCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { Player } from 'app/interfaces/models/game/player';

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
