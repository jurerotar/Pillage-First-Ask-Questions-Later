import { useSuspenseQuery } from '@tanstack/react-query';
import type { Player } from 'app/interfaces/models/game/player';
import { playerCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const usePlayer = () => {
  const { fetcher } = use(ApiContext);

  const { data: currentPlayer } = useSuspenseQuery<Player>({
    queryKey: [playerCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Player>('/me');
      return data;
    },
    staleTime: Number.POSITIVE_INFINITY,
  });

  return {
    currentPlayer,
  };
};
