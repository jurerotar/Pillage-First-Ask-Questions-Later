import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { Tile } from 'app/interfaces/models/game/tile';
import { worldItemSchema } from 'app/interfaces/models/game/world-item';

const tileWorldItemSchema = worldItemSchema.omit({ tileId: true }).nullable();

export const useTileWorldItem = (tileId: Tile['id']) => {
  const { fetcher } = use(ApiContext);

  const { data: worldItem } = useSuspenseQuery({
    queryKey: ['tile-world-item', tileId],
    queryFn: async () => {
      const { data } = await fetcher(`/tiles/${tileId}/world-item`);

      return tileWorldItemSchema.parse(data);
    },
  });

  return {
    worldItem,
  };
};
