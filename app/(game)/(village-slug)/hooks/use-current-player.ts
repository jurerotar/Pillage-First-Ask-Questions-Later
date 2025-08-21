import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { Player } from 'app/interfaces/models/game/player';
import { playersCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

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
