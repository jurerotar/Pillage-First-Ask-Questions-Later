import { useQuery } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { usePlayers } from 'app/[game]/hooks/use-players';
import { database } from 'database/database';
import type { Server } from 'interfaces/models/game/server';
import type { OccupiedOasisTile } from 'interfaces/models/game/tile';
import type { Village } from 'interfaces/models/game/village';

export const villagesCacheKey = 'villages';

export const getVillages = (serverId: Server['id']) => database.villages.where({ serverId }).toArray();

export const getVillageById = (villages: Village[], villageId: Village['id']): Village => {
  return villages.find(({ id }) => id === villageId)!;
};

// const getVillageByCoordinates = (villages: Village[], coordinates: Village['coordinates']): Village | null => {
//   return villages.find(({ coordinates: { x, y } }) => coordinates.x === x && coordinates.y === y) ?? null;
// };
//
// const getVillageByOasis = (villages: Village[], { villageId }: OccupiedOasisTile): Village => {
//   return villages.find(({ id }) => villageId === id)!;
// };

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
