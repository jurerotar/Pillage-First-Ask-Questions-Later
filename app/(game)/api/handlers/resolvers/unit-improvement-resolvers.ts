import type { Resolver } from 'app/interfaces/models/common';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { UnitImprovement } from 'app/interfaces/models/game/unit-improvement';
import { unitImprovementCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const unitImprovementResolver: Resolver<
  GameEvent<'unitImprovement'>
> = async (queryClient, args) => {
  const { unitId } = args;

  queryClient.setQueryData<UnitImprovement[]>(
    [unitImprovementCacheKey],
    (prevData) => {
      return prevData!.map((unitImprovement) => {
        if (unitImprovement.unitId !== unitId) {
          return unitImprovement;
        }

        return {
          ...unitImprovement,
          level: unitImprovement.level + 1,
        };
      });
    },
  );
};
