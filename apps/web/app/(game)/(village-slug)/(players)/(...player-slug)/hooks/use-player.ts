import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { type Player, playerSchema } from '@pillage-first/types/models/player';
import { playerCacheKey } from 'app/(game)/constants/query-keys.ts';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const usePlayer = (playerSlug: Player['slug']) => {
  const { fetcher } = use(ApiContext);

  const { data: player } = useSuspenseQuery({
    queryKey: [playerCacheKey, playerSlug],
    queryFn: async () => {
      const response = await fetcher(`/players/${playerSlug}`);

      return playerSchema.parse(response.data);
    },
  });

  return {
    player,
  };
};
