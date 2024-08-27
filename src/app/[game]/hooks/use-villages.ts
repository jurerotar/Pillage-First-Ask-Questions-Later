import { useQuery } from '@tanstack/react-query';
import { usePlayers } from 'app/[game]/hooks/use-players';
import type { Player } from 'interfaces/models/game/player';
import type { OccupiedOasisTile } from 'interfaces/models/game/tile';
import type { Village } from 'interfaces/models/game/village';

export const villagesCacheKey = 'villages';

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
  const { playerId } = usePlayers();

  const { data: villages } = useQuery<Village[]>({
    queryKey: [villagesCacheKey],
    initialData: [],
  });

  const playerVillages: Village[] = villages.filter((village: Village) => village.playerId === playerId);
  const npcVillages: Village[] = villages.filter((village: Village) => village.playerId !== playerId);

  const getVillageByCoordinates = (coordinates: Village['coordinates']): Village | null => {
    return villages.find(({ coordinates: { x, y } }) => coordinates.x === x && coordinates.y === y) ?? null;
  };

  const getVillageByOasis = ({ villageId }: OccupiedOasisTile): Village => {
    return villages.find(({ id }) => villageId === id)!;
  };

  const getPlayerByOasis = (oasis: OccupiedOasisTile): Player['id'] => {
    return getVillageByOasis(oasis)!.playerId;
  };

  return {
    villages,
    playerVillages,
    npcVillages,
    getVillageByCoordinates,
    getVillageByOasis,
    getPlayerByOasis,
  };
};
