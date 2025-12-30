import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { type Player, playerSchema } from 'app/interfaces/models/game/player';

export const usePlayer = (playerSlug: Player['slug']) => {
  const { fetcher } = use(ApiContext);

  const { data: player } = useSuspenseQuery({
    queryKey: ['player-info', playerSlug],
    queryFn: async () => {
      const response = await fetcher(`/players/${playerSlug}`);

      return playerSchema.parse(response.data);
    },
  });

  return {
    player,
  };
};
