import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useMe } from 'app/(game)/(village-slug)/hooks/use-me';
import { unitImprovementCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

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
