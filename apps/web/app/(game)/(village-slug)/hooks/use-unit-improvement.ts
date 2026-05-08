import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { unitImprovementCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useMe } from './use-me';

export const useUnitImprovement = () => {
  const { apiClient } = use(ApiContext);
  const { player } = useMe();

  const { data: unitImprovements } = useSuspenseQuery({
    queryKey: [unitImprovementCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/players/:playerId/unit-improvements',
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
    unitImprovements,
  };
};
