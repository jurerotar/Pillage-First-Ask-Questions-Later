import type { Resolver } from 'app/interfaces/models/common';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';
import { unitResearchCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const unitResearchResolver: Resolver<GameEvent<'unitResearch'>> = async (queryClient, args) => {
  const { villageId, unitId } = args;

  queryClient.setQueryData<UnitResearch[]>([unitResearchCacheKey], (unitResearch) => {
    return [...unitResearch!, { villageId, unitId }];
  });
};
