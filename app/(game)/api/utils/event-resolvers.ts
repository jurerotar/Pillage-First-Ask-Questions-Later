import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { QueryClient } from '@tanstack/react-query';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { getGameEventResolver } from 'app/(game)/api/utils/event-type-mapper';
import { isEventWithResourceCost } from 'app/(game)/guards/event-guards';
import { updateVillageResourcesAt } from 'app/(game)/api/utils/village';
import type { EventResolvedApiNotificationEvent } from 'app/interfaces/api';
import { eventResolvedKey } from 'app/(game)/keys/event-keys';

let scheduledTimeout: number | null = null;

const resolveEvent = async (queryClient: QueryClient, eventId: GameEvent['id']) => {
  const events = queryClient.getQueryData<GameEvent[]>([eventsCacheKey])!;
  const event = events.find(({ id }) => id === eventId)!;

  // If event updates any village property (new building, returning troops,...) we need to calculate the amount of resources before
  // said update happens
  if (isEventWithResourceCost(event)) {
    updateVillageResourcesAt(queryClient, event.villageId, event.startsAt + event.duration);
  }

  const resolver = getGameEventResolver(event.type)!;

  // @ts-expect-error - This one can't be solved, resolver returns every possible GameEvent option
  await resolver(queryClient, event);

  queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (events) => {
    return events!.filter(({ id }) => id !== eventId);
  });

  self.postMessage({
    eventKey: eventResolvedKey,
    cachesToClearOnResolve: event.cachesToClearOnResolve,
  } satisfies EventResolvedApiNotificationEvent);
};

export const scheduleNextEvent = async (queryClient: QueryClient) => {
  if (scheduledTimeout !== null) {
    clearTimeout(scheduledTimeout);
    scheduledTimeout = null;
  }

  const pastOrFutureEvents = queryClient.getQueryData<GameEvent[]>([eventsCacheKey]) ?? [];

  const now = Date.now();

  for (const event of pastOrFutureEvents) {
    const endsAt = event.startsAt + event.duration;

    if (endsAt > now) {
      break;
    }

    await resolveEvent(queryClient, event.id);
  }

  // At this point, all remaining events are future events
  const futureEvents = queryClient.getQueryData<GameEvent[]>([eventsCacheKey]) ?? [];

  if (futureEvents.length === 0) {
    return;
  }

  const nextEvent = futureEvents[0];

  scheduledTimeout = self.setTimeout(
    async () => {
      await resolveEvent(queryClient, nextEvent.id);
      await scheduleNextEvent(queryClient);
    },
    nextEvent.startsAt + nextEvent.duration - now,
  );
};
