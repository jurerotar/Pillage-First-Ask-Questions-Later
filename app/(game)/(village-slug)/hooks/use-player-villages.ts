import { useSuspenseQuery } from '@tanstack/react-query';
import type { PlayerVillage } from 'app/interfaces/models/game/village';
import { playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { usePlayers } from 'app/(game)/(village-slug)/hooks/use-players';

export const usePlayerVillages = () => {
  const { fetcher } = use(ApiContext);
  const { currentPlayer } = usePlayers();

  const { data: playerVillages } = useSuspenseQuery<PlayerVillage[]>({
    queryKey: [playerVillagesCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<PlayerVillage[]>(`/players/${currentPlayer.id}/villages`);
      return data;
    },
  });

  return {
    playerVillages,
  };
};
