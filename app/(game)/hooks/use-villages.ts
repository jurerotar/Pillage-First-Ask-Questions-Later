import { useQuery } from '@tanstack/react-query';
import type { Player } from 'app/interfaces/models/game/player';
import type { OccupiedOasisTile, Tile } from 'app/interfaces/models/game/tile';
import type { Village } from 'app/interfaces/models/game/village';
import { villagesCacheKey } from 'app/(game)/constants/query-keys';
import { usePlayers } from 'app/(game)/hooks/use-players';

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
  const { getCurrentPlayer } = usePlayers();

  const { data: villages } = useQuery<Village[]>({
    queryKey: [villagesCacheKey],
    initialData: [],
  });

  const getVillageById = (tileId: Tile['id']): Village | null => {
    return villages.find(({ id }) => id === tileId) ?? null;
  };

  const getVillageByOasis = ({ villageId }: OccupiedOasisTile): Village => {
    return villages.find(({ id }) => villageId === id)!;
  };

  const getPlayerByOasis = (oasis: OccupiedOasisTile): Player['id'] => {
    return getVillageByOasis(oasis)!.playerId;
  };

  const getPlayerVillages = (): Village[] => {
    const currentPlayer = getCurrentPlayer();
    return villages.filter((village: Village) => village.playerId === currentPlayer.id);
  };

  return {
    villages,
    getVillageById,
    getVillageByOasis,
    getPlayerByOasis,
    getPlayerVillages,
  };
};
