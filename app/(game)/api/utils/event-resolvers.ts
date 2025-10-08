import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { QueryClient } from '@tanstack/react-query';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { getGameEventResolver } from 'app/(game)/api/utils/event-type-mapper';
import { isEventWithResourceCost } from 'app/(game)/guards/event-guards';
import { updateVillageResourcesAt } from 'app/(game)/api/utils/village';
import type { EventApiNotificationEvent } from 'app/interfaces/api';
import type { DbFacade } from 'app/(game)/api/database-facade';

let scheduledTimeout: number | null = null;

const resolveEvent = async (
  queryClient: QueryClient,
  database: DbFacade,
  eventId: GameEvent['id'],
) => {
  const events = queryClient.getQueryData<GameEvent[]>([eventsCacheKey])!;
  const event = events.find(({ id }) => id === eventId)!;

  // If event updates any village property (new building, returning troops,...) we need to calculate the amount of resources before
  // said update happens
  if (isEventWithResourceCost(event)) {
    updateVillageResourcesAt(
      database,
      event.villageId,
      event.startsAt + event.duration,
    );
  }

  try {
    const resolver = getGameEventResolver(event.type)!;

    // @ts-expect-error - This one can't be solved, resolver returns every possible GameEvent option
    await resolver(queryClient, database, event);

    queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (events) => {
      return events!.filter(({ id }) => id !== eventId);
    });

    self.postMessage({
      eventKey: 'event:worker-event-resolve-success',
      ...event,
    } satisfies EventApiNotificationEvent);
  } catch (error) {
    console.error(error);
    self.postMessage({
      eventKey: 'event:worker-event-resolve-error',
      ...event,
    } satisfies EventApiNotificationEvent);
  }
};

// TODO: This code is probably bugged, make sure to refactor and double-check when possible
export const scheduleNextEvent = async (
  queryClient: QueryClient,
  database: DbFacade,
) => {
  if (scheduledTimeout !== null) {
    self.clearTimeout(scheduledTimeout);
  }

  const pastOrFutureEvents =
    queryClient.getQueryData<GameEvent[]>([eventsCacheKey]) ?? [];

  const now = Date.now();

  for (const event of pastOrFutureEvents) {
    const endsAt = event.startsAt + event.duration;

    if (endsAt > now) {
      break;
    }

    await resolveEvent(queryClient, database, event.id);
  }

  // At this point, all remaining events are future events
  const futureEvents =
    queryClient.getQueryData<GameEvent[]>([eventsCacheKey]) ?? [];

  if (futureEvents.length === 0) {
    return;
  }

  const nextEvent = futureEvents[0];

  scheduledTimeout = self.setTimeout(
    async () => {
      scheduledTimeout = null;
      await resolveEvent(queryClient, database, nextEvent.id);
      await scheduleNextEvent(queryClient, database);
    },
    nextEvent.startsAt + nextEvent.duration - now,
  );
};
