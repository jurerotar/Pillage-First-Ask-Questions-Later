import { useSuspenseQuery } from '@tanstack/react-query';
import type { Player } from 'app/interfaces/models/game/player';
import type { OccupiedOasisTile, Tile } from 'app/interfaces/models/game/tile';
import type { Village } from 'app/interfaces/models/game/village';
import { villagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { usePlayerVillages } from 'app/(game)/(village-slug)/hooks/use-player-villages';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

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

  const getVillageByCoordinates = (
    coordinates: Tile['coordinates'],
  ): Village | null => {
    return (
      villages.find(
        ({ coordinates: villageCoordinates }) =>
          coordinates.x === villageCoordinates.x &&
          coordinates.y === villageCoordinates.y,
      ) ?? null
    );
  };

  const getVillageByOasis = ({ villageId }: OccupiedOasisTile): Village => {
    return villages.find(({ id }) => villageId === id)!;
  };

  const getPlayerByOasis = (oasis: OccupiedOasisTile): Player['id'] => {
    return getVillageByOasis(oasis)!.playerId;
  };

  return {
    villages,
    getVillageByCoordinates,
    getVillageByOasis,
    getPlayerByOasis,
  };
};
