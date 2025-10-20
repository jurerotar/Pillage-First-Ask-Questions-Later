import { useSuspenseQuery } from '@tanstack/react-query';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { Tile } from 'app/interfaces/models/game/tile';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useTileTroops = (tileId: Tile['id']) => {
  const { fetcher } = use(ApiContext);

  const { data: troops } = useSuspenseQuery({
    queryKey: ['tile-troops', tileId],
    queryFn: async () => {
      const { data } = await fetcher<Troop[]>(`/tiles/${tileId}/troops`);
      return data;
    },
  });

  return {
    troops,
  };
};
