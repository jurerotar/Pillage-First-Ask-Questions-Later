import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Unit } from 'app/interfaces/models/game/unit';
import type { UnitImprovement } from 'app/interfaces/models/game/unit-improvement';
import { unitImprovementCacheKey } from 'app/query-keys';

export const useUnitImprovement = () => {
  const queryClient = useQueryClient();

  const { data: unitImprovements } = useQuery<UnitImprovement[]>({
    queryKey: [unitImprovementCacheKey],
    initialData: [],
  });

  const upgradeUnitTier = (tier: Unit['tier']) => {
    queryClient.setQueryData<UnitImprovement[]>([unitImprovementCacheKey], (prevData) => {
      return prevData!.map((unitImprovement) => {
        if (tier !== unitImprovement.tier) {
          return unitImprovement;
        }

        return {
          ...unitImprovement,
          level: unitImprovement.level + 1,
        };
      });
    });
  };

  return {
    unitImprovements,
    upgradeUnitTier,
  };
};
