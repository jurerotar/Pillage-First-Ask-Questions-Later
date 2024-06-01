import { useQuery } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import type { Tile } from 'interfaces/models/game/tile';
import type { Troop } from 'interfaces/models/game/troop';
import { getParsedFileContents } from 'app/utils/opfs';

export const troopsCacheKey = 'units';

export const useTroops = () => {
  const { serverHandle } = useCurrentServer();

  const { data: troops } = useQuery<Troop[]>({
    queryFn: () => getParsedFileContents(serverHandle, 'troops'),
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
