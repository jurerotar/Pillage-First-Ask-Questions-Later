import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { unitImprovementCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const useUnitImprovement = () => {
  const { apiClient } = use(ApiContext);

  const { data: unitImprovements } = useSuspenseQuery({
    queryKey: [unitImprovementCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/me/unit-improvements');

      return data;
    },
  });

  return {
    unitImprovements,
  };
};
