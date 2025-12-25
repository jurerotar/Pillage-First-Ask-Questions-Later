import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { Tile } from 'app/interfaces/models/game/tile';
import type { Troop } from 'app/interfaces/models/game/troop';

export const useTileTroops = (tileId: Tile['id']) => {
  const { fetcher } = use(ApiContext);

  const { data: troops } = useSuspenseQuery<Troop[]>({
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
