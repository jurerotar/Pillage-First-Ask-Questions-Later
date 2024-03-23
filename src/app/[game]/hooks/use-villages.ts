import { database } from 'database/database';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { Village } from 'interfaces/models/game/village';
import { useQuery } from '@tanstack/react-query';
import { Server } from 'interfaces/models/game/server';
import { usePlayers } from 'app/[game]/hooks/use-players';
import { OccupiedOasisTile } from 'interfaces/models/game/tile';

export const villagesCacheKey = 'villages';

export const getVillages = (serverId: Server['id']) => database.villages.where({ serverId }).toArray();

export const useVillages = () => {
  const { serverId } = useCurrentServer();
  const { playerId } = usePlayers();

  const {
    data: villages,
    isLoading: isLoadingVillages,
    isSuccess: hasLoadedVillages,
    status: villagesQueryStatus,
  } = useQuery<Village[]>({
    queryFn: () => getVillages(serverId),
    queryKey: [villagesCacheKey, serverId],
    initialData: [],
  });

  const playerVillages: Village[] = villages?.filter((village: Village) => village.playerId === playerId);
  const npcVillages: Village[] = villages?.filter((village: Village) => village.playerId !== playerId);

  const getVillageByCoordinates = (coordinates: Village['coordinates']): Village | null => {
    return villages.find(({ coordinates: { x, y } }) => coordinates.x === x && coordinates.y === y) ?? null;
  };

  const getVillageByOasis = ({ villageId }: OccupiedOasisTile): Village => {
    return villages.find(({ id }) => villageId === id)!;
  };

  return {
    villages,
    isLoadingVillages,
    hasLoadedVillages,
    villagesQueryStatus,
    playerVillages,
    npcVillages,
    getVillageByCoordinates,
    getVillageByOasis,
  };
};
