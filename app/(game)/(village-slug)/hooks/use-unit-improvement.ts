import { useSuspenseQuery } from '@tanstack/react-query';
import type { UnitImprovement } from 'app/interfaces/models/game/unit-improvement';
import { unitImprovementCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useUnitImprovement = () => {
  const { fetcher } = use(ApiContext);

  const { data: unitImprovements } = useSuspenseQuery<UnitImprovement[]>({
    queryKey: [unitImprovementCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<UnitImprovement[]>(
        '/me/unit-improvements',
      );
      return data;
    },
  });

  return {
    unitImprovements,
  };
};
