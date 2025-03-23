import { useQuery } from '@tanstack/react-query';
import type { Player } from 'app/interfaces/models/game/player';
import type { OccupiedOasisTile, Tile } from 'app/interfaces/models/game/tile';
import type { Village } from 'app/interfaces/models/game/village';
import { villagesCacheKey } from 'app/(game)/constants/query-keys';
import { usePlayers } from 'app/(game)/hooks/use-players';
import { useMemo } from 'react';

export const getVillageById = (villages: Village[], villageId: Village['id']): Village => {
  return villages.find(({ id }) => id === villageId)!;
};

export const useVillages = () => {
  const { currentPlayer } = usePlayers();

  const { data: villages } = useQuery<Village[]>({
    queryKey: [villagesCacheKey],
    initialData: [],
  });

  // Player villages are always in the beginning of the villages array, so we can break as soon as we encounter a non-player village
  const playerVillages = useMemo<Village[]>(() => {
    const result: Village[] = [];

    for (const village of villages) {
      if (village.playerId !== currentPlayer.id) {
        break;
      }
      result.push(village);
    }

    return result;
  }, [villages, currentPlayer.id]);

  const getVillageById = (tileId: Tile['id']): Village | null => {
    return villages.find(({ id }) => id === tileId) ?? null;
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
    getVillageById,
    getVillageByOasis,
    getPlayerByOasis,
  };
};
