import { useQuery } from '@tanstack/react-query';
import type { PlayerVillage } from 'app/interfaces/models/game/village';
import { playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const usePlayerVillages = () => {
  const { data: playerVillages } = useQuery<PlayerVillage[]>({
    queryKey: [playerVillagesCacheKey],
    initialData: [],
  });

  return {
    playerVillages,
  };
};
