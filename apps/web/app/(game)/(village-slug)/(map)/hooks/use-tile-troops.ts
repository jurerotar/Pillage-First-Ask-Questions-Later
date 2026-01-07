import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import type { Tile } from '@pillage-first/types/models/tile';
import { troopSchema } from '@pillage-first/types/models/troop';
import { ApiContext } from 'app/(game)/providers/api-provider';

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
