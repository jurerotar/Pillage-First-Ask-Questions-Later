import { useSuspenseQuery } from '@tanstack/react-query';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { Unit } from 'app/interfaces/models/game/unit';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';
import { unitResearchCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { getUnitData, getUnitsByTribe } from 'app/assets/utils/units';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';

export const useUnitResearch = () => {
  const { fetcher } = use(ApiContext);
  const tribe = useTribe();
  const { currentVillage } = useCurrentVillage();

  const unitsByTribe = getUnitsByTribe(tribe);
  const researchableUnits = unitsByTribe.filter(
    (unit) => !unit.id.includes('SETTLER'),
  );

  const { data: unitResearch } = useSuspenseQuery<UnitResearch[]>({
    queryKey: [unitResearchCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher<UnitResearch[]>(
        `/researched-units/${currentVillage.id}`,
      );
      return data;
    },
  });

  const isUnitResearched = (unitId: Unit['id']): boolean => {
    return !!unitResearch.find(
      (unitResearch) => unitResearch.unitId === unitId,
    );
  };

  const getResearchedUnits = () => {
    return researchableUnits.filter(({ id }) => isUnitResearched(id));
  };

  const getResearchedUnitsByCategory = (category: Unit['category']) => {
    const researchedUnits = getResearchedUnits();

    return researchedUnits.filter(({ id }) => {
      const unit = getUnitData(id);
      return unit.category === category;
    });
  };

  return {
    unitResearch,
    isUnitResearched,
    getResearchedUnitsByCategory,
    researchableUnits,
  };
};
