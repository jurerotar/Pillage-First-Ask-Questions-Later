import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { unitCombatStatsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useMe } from './use-me';

export const useUnitCombatStats = () => {
  const { apiClient } = use(ApiContext);
  const { player } = useMe();

  const { data: unitCombatStats } = useSuspenseQuery({
    queryKey: [unitCombatStatsCacheKey, player.id],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/players/:playerId/unit-combat-stats',
        {
          path: {
            playerId: player.id,
          },
        },
      );

      return data;
    },
  });

  return {
    unitCombatStats,
  };
};
