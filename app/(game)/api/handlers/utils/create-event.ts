import type { QueryClient } from '@tanstack/react-query';
import type {
  GameEvent,
  GameEventType,
} from 'app/interfaces/models/game/game-event';
import { eventFactory } from 'app/factories/event-factory';
import {
  checkAndSubtractVillageResources,
  getEventDuration,
  getEventStartTime,
  insertEvents,
  notifyAboutEventCreationFailure,
} from 'app/(game)/api/handlers/utils/events';
import { scheduleNextEvent } from 'app/(game)/api/utils/event-resolvers';
import type { Database } from 'app/interfaces/models/common';

export const validateAndInsertEvents = async (
  queryClient: QueryClient,
  events: GameEvent[],
) => {
  const hasSuccessfullyValidatedAndSubtractedResources =
    checkAndSubtractVillageResources(queryClient, events);

  if (!hasSuccessfullyValidatedAndSubtractedResources) {
    notifyAboutEventCreationFailure(events);
    return;
  }

  insertEvents(queryClient, events);
};

type CreateNewEventsBody = Omit<GameEvent, 'id' | 'startsAt' | 'duration'> & {
  amount: number;
};

export const createClientEvents = async (
  queryClient: QueryClient,
  database: Database,
  args: CreateNewEventsBody,
) => {
  // These type coercions are super hacky. Essentially, args is GameEvent<T> but without 'startsAt' and 'duration'.
  const startsAt = getEventStartTime(queryClient, args as unknown as GameEvent);
  const duration = getEventDuration(queryClient, args as unknown as GameEvent);

  const events: GameEvent[] = (() => {
    const amount = args?.amount ?? 1;

    if (amount > 1) {
      const events: GameEvent[] = new Array(amount);

      for (let i = 0; i < amount; i++) {
        events[i] = eventFactory({
          ...args,
          startsAt: startsAt + i * duration,
          duration,
        });
      }

      return events;
    }

    return [eventFactory({ ...args, startsAt, duration })];
  })();

  await validateAndInsertEvents(queryClient, events);
  await scheduleNextEvent(queryClient, database);
};

// This function is used for events created on the server. "createClientEvents" is used for client-sent events.
export const createEvent = async <T extends GameEventType>(
  queryClient: QueryClient,
  args: Omit<GameEvent<T>, 'id' | 'startsAt' | 'duration'>,
) => {
  // These type coercions are super hacky. Essentially, args is GameEvent<T> but without 'startsAt' and 'duration'.
  const startsAt = getEventStartTime(queryClient, args as unknown as GameEvent);
  const duration = getEventDuration(queryClient, args as unknown as GameEvent);

  const eventFactoryArgs = {
    ...args,
    duration,
    startsAt,
  } as Omit<GameEvent<T>, 'id'>;

  const events = [eventFactory<T>(eventFactoryArgs)];

  await validateAndInsertEvents(queryClient, events);
};
