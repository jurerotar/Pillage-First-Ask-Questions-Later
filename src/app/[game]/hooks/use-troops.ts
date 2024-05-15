import { database } from 'database/database';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { useQuery } from '@tanstack/react-query';
import { Server } from 'interfaces/models/game/server';
import { Tile } from 'interfaces/models/game/tile';
import { Troop } from 'interfaces/models/game/troop';

export const troopsCacheKey = 'units';

export const getTroops = (serverId: Server['id']) => database.troops.where({ serverId }).toArray();

export const useTroops = () => {
  const { serverId } = useCurrentServer();

  const { data: troops } = useQuery({
    queryFn: () => getTroops(serverId),
    queryKey: [troopsCacheKey, serverId],
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
