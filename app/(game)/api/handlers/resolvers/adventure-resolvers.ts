import type { Resolver } from 'app/interfaces/models/common';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { calculateAdventurePointIncreaseEventDuration } from 'app/factories/utils/event';
import type { Server } from 'app/interfaces/models/game/server';
import { adventurePointsCacheKey, serverCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { AdventurePoints } from 'app/interfaces/models/game/adventure-points';
import { createEvent } from 'app/(game)/api/handlers/utils/create-event';

export const adventurePointIncreaseResolver: Resolver<GameEvent<'adventurePointIncrease'>> = async (queryClient, args) => {
  const { startsAt, duration } = args;

  queryClient.setQueryData<AdventurePoints>([adventurePointsCacheKey], (prevState) => {
    return {
      amount: (prevState?.amount ?? 0) + 1,
    };
  });

  const server = queryClient.getQueryData<Server>([serverCacheKey])!;

  createEvent<'adventurePointIncrease'>(queryClient, {
    type: 'adventurePointIncrease',
    startsAt: startsAt + duration,
    duration: calculateAdventurePointIncreaseEventDuration(server),
    cachesToClear: [adventurePointsCacheKey],
  });
};
