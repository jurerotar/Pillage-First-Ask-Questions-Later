import type { Resolver } from 'app/interfaces/models/common';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { createEventFn } from 'app/(game)/hooks/utils/events';
import { calculateAdventurePointIncreaseEventDuration } from 'app/factories/utils/event';
import type { Server } from 'app/interfaces/models/game/server';
import { adventurePointsCacheKey, currentServerCacheKey } from 'app/(game)/constants/query-keys';
import type { AdventurePoints } from 'app/interfaces/models/game/adventure-points';

export const adventurePointIncreaseResolver: Resolver<GameEvent<'adventurePointIncrease'>> = async (args, queryClient) => {
  const { startsAt, duration } = args;

  queryClient.setQueryData<AdventurePoints>([adventurePointsCacheKey], (prevState) => {
    return {
      amount: (prevState?.amount ?? 0) + 1,
    };
  });

  const server = queryClient.getQueryData<Server>([currentServerCacheKey])!;

  await createEventFn<'adventurePointIncrease'>(queryClient, {
    type: 'adventurePointIncrease',
    startsAt: startsAt + duration,
    duration: calculateAdventurePointIncreaseEventDuration(server),
  });
};
