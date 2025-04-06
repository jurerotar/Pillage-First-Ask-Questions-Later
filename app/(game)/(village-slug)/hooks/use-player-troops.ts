import { useQuery } from '@tanstack/react-query';
import { playerTroopsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Troop } from 'app/interfaces/models/game/troop';

export const usePlayerTroops = () => {
  const { data: playerTroops } = useQuery<Troop[]>({
    queryKey: [playerTroopsCacheKey],
    initialData: [],
  });

  return {
    playerTroops,
  };
};
