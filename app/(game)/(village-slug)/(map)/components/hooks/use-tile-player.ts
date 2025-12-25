import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { Player } from 'app/interfaces/models/game/player';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import type { Tile } from 'app/interfaces/models/game/tile';
import type { Village } from 'app/interfaces/models/game/village';

type UseTilePlayerReturn = {
  player: Player;
  reputation: Reputation;
  village: Village;
  population: number;
};

export const useTilePlayer = (tileId: Tile['id']) => {
  const { fetcher } = use(ApiContext);

  const { data: tilePlayer } = useSuspenseQuery<UseTilePlayerReturn>({
    queryKey: ['tile-player', tileId],
    queryFn: async () => {
      const { data } = await fetcher<UseTilePlayerReturn>(
        `/tiles/${tileId}/player`,
      );
      return data;
    },
  });

  return {
    ...tilePlayer,
  };
};
