import type {
  GameEvent,
  GameEventType,
} from 'app/interfaces/models/game/game-event';
import {
  checkAndSubtractVillageResources,
  getEventDuration,
  getEventStartTime,
  insertEvents,
  notifyAboutEventCreationFailure,
} from 'app/(game)/api/handlers/utils/events';
import { scheduleNextEvent } from 'app/(game)/api/utils/event-resolvers';
import type { DbFacade } from 'app/(game)/api/database-facade';

const eventFactory = <T extends GameEventType>(
  args: Omit<GameEvent<T>, 'id'>,
): GameEvent<T> => {
  const id = crypto.randomUUID();

  return {
    ...args,
    id,
  } as GameEvent<T>;
};

const validateAndInsertEvents = (database: DbFacade, events: GameEvent[]) => {
  const hasSuccessfullyValidatedAndSubtractedResources =
    checkAndSubtractVillageResources(database, events);

  if (!hasSuccessfullyValidatedAndSubtractedResources) {
    notifyAboutEventCreationFailure(events);
    return;
  }

  insertEvents(database, events);
};

type CreateNewEventsBody = Omit<GameEvent, 'id' | 'startsAt' | 'duration'> & {
  amount: number;
};

export const createClientEvents = (
  database: DbFacade,
  args: CreateNewEventsBody,
) => {
  // These type coercions are super hacky. Essentially, args is GameEvent<T> but without 'startsAt' and 'duration'.
  const startsAt = getEventStartTime(database, args as unknown as GameEvent);
  const duration = getEventDuration(database, args as unknown as GameEvent);

  const events: GameEvent[] = (() => {
    const amount = args?.amount ?? 1;

    if (amount > 1) {
      const events: GameEvent[] = Array.from({ length: amount });

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

  validateAndInsertEvents(database, events);
  scheduleNextEvent(database);
};

// This function is used for events created on the server. "createClientEvents" is used for client-sent events.
export const createEvent = <T extends GameEventType>(
  database: DbFacade,
  args: Omit<GameEvent<T>, 'id' | 'startsAt' | 'duration' | 'resolvesAt'>,
) => {
  // These type coercions are super hacky. Essentially, args is GameEvent<T> but without 'startsAt' and 'duration'.
  const startsAt = getEventStartTime(database, args as unknown as GameEvent);
  const duration = getEventDuration(database, args as unknown as GameEvent);

  const eventFactoryArgs = {
    ...args,
    duration,
    startsAt,
  } as Omit<GameEvent<T>, 'id'>;

  const events = [eventFactory<T>(eventFactoryArgs)];

  validateAndInsertEvents(database, events);
};
