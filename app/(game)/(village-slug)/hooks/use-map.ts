import { useSuspenseQuery } from '@tanstack/react-query';
import type { ContextualTile, Tile } from 'app/interfaces/models/game/tile';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';

export const useMap = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: map } = useSuspenseQuery<Tile[]>({
    queryKey: ['api'],
    queryFn: async () => {
      const { data } = await fetcher<Tile[]>('/map');
      return data;
    },
  });

  const { data: contextualMap } = useSuspenseQuery<ContextualTile[]>({
    queryKey: ['api-2', currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher<ContextualTile[]>(`/map/${currentVillage.id}/contextual`);
      return data;
    },
  });

  const getTileByTileId = (tileId: Tile['id']): Tile => {
    return map.find(({ id }) => tileId === id)!;
  };

  return {
    map,
    contextualMap,
    getTileByTileId,
  };
};
