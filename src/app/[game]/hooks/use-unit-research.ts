import { useQuery } from '@tanstack/react-query';
import type { UnitResearch } from 'interfaces/models/game/unit-research';

export const unitResearchCacheKey = 'unit-research';

export const useUnitResearch = () => {
  const { data: unitResearch } = useQuery<UnitResearch[]>({
    queryKey: [unitResearchCacheKey],
    initialData: [],
  });

  return {
    unitResearch,
  };
};
