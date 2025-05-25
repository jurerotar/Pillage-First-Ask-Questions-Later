import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { QueryClient } from '@tanstack/react-query';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { getGameEventResolver } from 'app/(game)/api/utils/event-type-mapper';
import { doesEventRequireResourceUpdate } from 'app/(game)/guards/event-guards';
import { updateVillageResourcesAt } from 'app/(game)/api/utils/village';

let scheduledTimeout: number | null = null;

const resolveEvent = async (queryClient: QueryClient, eventId: GameEvent['id']) => {
  const events = queryClient.getQueryData<GameEvent[]>([eventsCacheKey])!;
  const event = events.find(({ id }) => id === eventId)!;

  queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (events) => {
    return events!.filter(({ id }) => id !== eventId);
  });

  // If event updates any village property (new building, returning troops,...) we need to calculate the amount of resources before
  // said update happens
  if (doesEventRequireResourceUpdate(event, event.type)) {
    updateVillageResourcesAt(queryClient, event.villageId, event.startsAt + event.duration);
  }

  const resolver = getGameEventResolver(event.type)!;

  // @ts-expect-error - This one can't be solved, resolver returns every possible GameEvent option
  await resolver(queryClient, event);

  self.postMessage({
    type: 'event:resolved',
    cachesToClear: event.cachesToClear,
  });
};

export const scheduleNextEvent = async (queryClient: QueryClient) => {
  if (scheduledTimeout !== null) {
    clearTimeout(scheduledTimeout);
    scheduledTimeout = null;
  }

  const events = queryClient.getQueryData<GameEvent[]>([eventsCacheKey]) ?? [];

  const now = Date.now();

  for (const event of events) {
    const endsAt = event.startsAt + event.duration;

    if (endsAt > now) {
      break;
    }

    await resolveEvent(queryClient, event.id);
  }

  // At this point, all remaining events are future events
  if (events.length === 0) {
    return;
  }

  const nextEvent = events[0];

  scheduledTimeout = self.setTimeout(
    async () => {
      await resolveEvent(queryClient, nextEvent.id);
      await scheduleNextEvent(queryClient);
    },
    nextEvent.startsAt + nextEvent.duration - now,
  );

};
