import { useSuspenseQuery } from '@tanstack/react-query';
import type { Player } from 'app/interfaces/models/game/player';
import type { OccupiedOasisTile, Tile } from 'app/interfaces/models/game/tile';
import type { Village } from 'app/interfaces/models/game/village';
import { villagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { usePlayerVillages } from 'app/(game)/(village-slug)/hooks/use-player-villages';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const getVillageById = (villages: Village[], villageId: Village['id']): Village => {
  return villages.find(({ id }) => id === villageId)!;
};

export const useVillages = () => {
  const { fetcher } = use(ApiContext);
  const { playerVillages } = usePlayerVillages();

  const { data: npcVillages } = useSuspenseQuery<Village[]>({
    queryKey: [villagesCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Village[]>('/villages');
      return data;
    },
  });

  const villages: Village[] = [...playerVillages, ...npcVillages];

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
    getVillageById,
    getVillageByOasis,
    getPlayerByOasis,
  };
};
