import { useSuspenseQuery } from '@tanstack/react-query';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { Unit } from 'app/interfaces/models/game/unit';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';
import { unitResearchCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { getUnitData } from 'app/(game)/(village-slug)/utils/units';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useUnitResearch = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: unitResearch } = useSuspenseQuery<UnitResearch[]>({
    queryKey: [unitResearchCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher<UnitResearch[]>(`/researched-units/${currentVillage.id}`);
      return data;
    },
  });

  const isUnitResearched = (unitId: Unit['id']): boolean => {
    return !!unitResearch.find((unitResearch) => unitResearch.unitId === unitId && unitResearch.isResearched);
  };

  const getResearchedUnits = () => unitResearch.filter(({ unitId }) => isUnitResearched(unitId));

  const getResearchedUnitsByCategory = (category: Unit['category']) => {
    const researchedUnits = getResearchedUnits();

    return researchedUnits.filter(({ unitId }) => {
      const unit = getUnitData(unitId);
      return unit.category === category;
    });
  };

  return {
    unitResearch,
    isUnitResearched,
    getResearchedUnitsByCategory,
  };
};
