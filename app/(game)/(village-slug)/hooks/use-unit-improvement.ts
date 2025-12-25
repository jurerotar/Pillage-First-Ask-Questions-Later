import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { unitImprovementCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { UnitImprovement } from 'app/interfaces/models/game/unit-improvement';

export const useUnitImprovement = () => {
  const { fetcher } = use(ApiContext);

  const { data: unitImprovements } = useSuspenseQuery<UnitImprovement[]>({
    queryKey: [unitImprovementCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<UnitImprovement[]>('/unit-improvements');
      return data;
    },
  });

  return {
    unitImprovements,
  };
};
