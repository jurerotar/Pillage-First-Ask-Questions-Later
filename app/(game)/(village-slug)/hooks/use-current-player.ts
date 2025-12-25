import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { playersCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { Player } from 'app/interfaces/models/game/player';

export const useCurrentPlayer = () => {
  const { fetcher } = use(ApiContext);

  const { data: currentPlayer } = useSuspenseQuery<Player>({
    queryKey: [playersCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Player>('/me');
      return data;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  return {
    currentPlayer,
  };
};
