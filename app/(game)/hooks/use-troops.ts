import { useQuery } from '@tanstack/react-query';
import type { Tile } from 'app/interfaces/models/game/tile';
import type { Troop } from 'app/interfaces/models/game/troop';
import { troopsCacheKey } from 'app/query-keys';

export const useTroops = () => {
  const { data: troops } = useQuery<Troop[]>({
    queryKey: [troopsCacheKey],
    initialData: [],
  });

  const getTroopsByTileId = (tileId: Tile['id']): Troop[] => {
    return troops.filter(({ tileId: id }) => id === tileId);
  };

  return {
    troops,
    getTroopsByTileId,
  };
};
