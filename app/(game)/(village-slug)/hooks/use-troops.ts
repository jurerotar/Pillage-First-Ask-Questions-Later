import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { troopsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { Tile } from 'app/interfaces/models/game/tile';
import type { Troop } from 'app/interfaces/models/game/troop';

export const useTroops = () => {
  const { fetcher } = use(ApiContext);

  const { data: troops } = useSuspenseQuery<Troop[]>({
    queryKey: [troopsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Troop[]>('/troops');
      return data;
    },
  });

  const getTroopsByTileId = (tileId: Tile['id']): Troop[] => {
    return troops.filter(({ tileId: id }) => id === tileId);
  };

  return {
    troops,
    getTroopsByTileId,
  };
};
