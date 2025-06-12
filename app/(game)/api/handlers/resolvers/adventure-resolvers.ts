import type { Resolver } from 'app/interfaces/models/common';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { adventurePointsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { AdventurePoints } from 'app/interfaces/models/game/adventure-points';
import { createEvent } from 'app/(game)/api/handlers/utils/create-event';

export const adventurePointIncreaseResolver: Resolver<GameEvent<'adventurePointIncrease'>> = async (queryClient, args) => {
  queryClient.setQueryData<AdventurePoints>([adventurePointsCacheKey], (prevState) => {
    return {
      amount: (prevState?.amount ?? 0) + 1,
    };
  });

  await createEvent<'adventurePointIncrease'>(queryClient, {
    // Args need to be present, because next events depends on end of last
    ...args,
    type: 'adventurePointIncrease',
    cachesToClearOnResolve: [adventurePointsCacheKey],
  });
};
