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

  const isUnitResearched = (unitId: Unit['id']) =>
    unitResearch.find((unitResearch) => unitResearch.unitId === unitId && unitResearch.researchedIn.includes(currentVillage.id));

  const researchedUnits = unitResearch.filter(({ unitId }) => isUnitResearched(unitId));

  const researchedInfantryUnits = researchedUnits.filter(({ unitId }) => {
    const unit = getUnitData(unitId);
    return unit.category === 'infantry';
  });

  const researchedCavalryUnits = researchedUnits.filter(({ unitId }) => {
    const unit = getUnitData(unitId);
    return unit.category === 'cavalry';
  });

  const researchedSiegeUnits = researchedUnits.filter(({ unitId }) => {
    const unit = getUnitData(unitId);
    return unit.category === 'siege';
  });

  const researchedSpecialUnits = researchedUnits.filter(({ unitId }) => {
    const unit = getUnitData(unitId);
    return unit.category === 'special';
  });

  return {
    unitResearch,
    researchUnit,
    isUnitResearched,
    researchedUnits,
    researchedInfantryUnits,
    researchedCavalryUnits,
    researchedSiegeUnits,
    researchedSpecialUnits,
  };
};
