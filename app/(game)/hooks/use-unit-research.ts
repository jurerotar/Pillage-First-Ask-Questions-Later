import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import type { Unit } from 'app/interfaces/models/game/unit';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';
import { unitResearchCacheKey } from 'app/query-keys';

export const useUnitResearch = () => {
  const queryClient = useQueryClient();
  const { currentVillageId } = useCurrentVillage();

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
          researchedIn: [...research.researchedIn, currentVillageId],
        };
      });
    });
  };

  const isUnitResearched = (unitId: Unit['id']) =>
    unitResearch.find((unitResearch) => unitResearch.unitId === unitId && unitResearch.researchedIn.includes(currentVillageId));

  const researchedUnits = unitResearch.filter(({ unitId }) => isUnitResearched(unitId));

  return {
    unitResearch,
    researchUnit,
    isUnitResearched,
    researchedUnits,
  };
};
