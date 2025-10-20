import { useSuspenseQuery } from '@tanstack/react-query';
import type { Tile } from 'app/interfaces/models/game/tile';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { WorldItem } from 'app/interfaces/models/game/world-item';

export const useTileWorldItem = (tileId: Tile['id']) => {
  const { fetcher } = use(ApiContext);

  const { data: worldItem } = useSuspenseQuery({
    queryKey: ['tile-world-item', tileId],
    queryFn: async () => {
      const { data } = await fetcher<WorldItem | null>(
        `/tiles/${tileId}/world-item`,
      );
      return data;
    },
  });

  return {
    worldItem,
  };
};
