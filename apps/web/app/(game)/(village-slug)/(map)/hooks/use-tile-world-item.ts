import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { Tile } from '@pillage-first/types/models/tile';
import { worldItemSchema } from '@pillage-first/types/models/world-item';
import { ApiContext } from 'app/(game)/providers/api-provider';

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
