import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { Unit } from 'app/interfaces/models/game/unit';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';
import { unitResearchCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { getUnitData } from 'app/(game)/(village-slug)/utils/units';

export const useUnitResearch = () => {
  const queryClient = useQueryClient();
  const { currentVillage } = useCurrentVillage();

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
