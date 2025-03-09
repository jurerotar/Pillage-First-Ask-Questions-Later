import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import type { Unit } from 'app/interfaces/models/game/unit';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';
import { unitResearchCacheKey } from 'app/(game)/constants/query-keys';
import { getUnitData } from 'app/(game)/utils/units';
import { use } from 'react';

export const useUnitResearch = () => {
  const queryClient = useQueryClient();
  const { currentVillage } = use(CurrentVillageContext);

  const { data: unitResearch } = useQuery<UnitResearch[]>({
    queryKey: [unitResearchCacheKey],
    initialData: [],
  });

  const researchUnit = (unitId: Unit['id']) => {
    queryClient.setQueryData<UnitResearch[]>([unitResearchCacheKey], (prevData) => {
      return prevData!.map((research) => {
        if (research.unitId !== unitId) {
          return research;
        }

        return {
          ...research,
          researchedIn: [...research.researchedIn, currentVillage.id],
        };
      });
    });
  };

  const isUnitResearched = (unitId: Unit['id']) => {
    return unitResearch.find((unitResearch) => unitResearch.unitId === unitId && unitResearch.researchedIn.includes(currentVillage.id));
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
    researchUnit,
    isUnitResearched,
    getResearchedUnitsByCategory,
  };
};
