import type { ApiHandler } from 'app/interfaces/api';
import { unitImprovementCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { UnitImprovement } from 'app/interfaces/models/game/unit-improvement';

export const getUnitImprovements: ApiHandler<UnitImprovement[]> = async (queryClient) => {
  const unitImprovements = queryClient.getQueryData<UnitImprovement[]>([unitImprovementCacheKey])!;

  return unitImprovements;
};
