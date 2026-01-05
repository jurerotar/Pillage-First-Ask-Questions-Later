import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { Tile } from 'app/interfaces/models/game/tile';
import { troopSchema } from 'app/interfaces/models/game/troop';

export const useTileTroops = (tileId: Tile['id']) => {
  const { fetcher } = use(ApiContext);

  const { data: tileTroops } = useSuspenseQuery({
    queryKey: ['tile-troops', tileId],
    queryFn: async () => {
      const { data } = await fetcher(`/tiles/${tileId}/troops`);

      return z.array(troopSchema).parse(data);
    },
  });

  return {
    tileTroops,
  };
};
