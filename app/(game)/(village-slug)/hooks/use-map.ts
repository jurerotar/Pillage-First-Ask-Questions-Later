import { useSuspenseQuery } from '@tanstack/react-query';
import { use, useCallback } from 'react';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { ContextualTile, Tile } from 'app/interfaces/models/game/tile';

export const useMap = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: contextualMap } = useSuspenseQuery<ContextualTile[]>({
    queryKey: ['contextual-map', eventsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher<ContextualTile[]>(
        `/map/${currentVillage.id}/contextual`,
      );
      return data;
    },
  });

  const getTileByTileId = useCallback(
    (tileId: Tile['id']): ContextualTile => {
      return contextualMap.find(({ id }) => tileId === id)!;
    },
    [contextualMap],
  );

  return {
    contextualMap,
    getTileByTileId,
  };
};
