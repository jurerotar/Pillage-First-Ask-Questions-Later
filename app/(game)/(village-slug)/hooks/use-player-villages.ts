import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentPlayer } from 'app/(game)/(village-slug)/hooks/use-current-player';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { PlayerVillage } from 'app/interfaces/models/game/village';

export const usePlayerVillages = () => {
  const { fetcher } = use(ApiContext);
  const { currentPlayer } = useCurrentPlayer();

  const { data: playerVillages } = useSuspenseQuery<PlayerVillage[]>({
    queryKey: [playerVillagesCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<PlayerVillage[]>(
        `/players/${currentPlayer.id}/villages`,
      );
      return data;
    },
  });

  return {
    playerVillages,
  };
};
