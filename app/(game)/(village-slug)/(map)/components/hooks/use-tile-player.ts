import type { Tile } from 'app/interfaces/models/game/tile';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { Player } from 'app/interfaces/models/game/player';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import type { Village } from 'app/interfaces/models/game/village';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

type UseTilePlayerReturn = {
  player: Player;
  reputation: Reputation;
  village: Village;
  population: number;
};

export const useTilePlayer = (tileId: Tile['id']) => {
  const { fetcher } = use(ApiContext);

  const { data: tilePlayer } = useSuspenseQuery({
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
