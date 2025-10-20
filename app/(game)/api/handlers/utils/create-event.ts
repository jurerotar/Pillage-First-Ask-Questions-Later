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
import type { DbFacade } from 'app/(game)/api/facades/database-facade';
import { markNeedsRescan } from 'app/(game)/api/engine/scheduler-signal';

const validateAndInsertEvents = (database: DbFacade, events: GameEvent[]) => {
  const hasSuccessfullyValidatedAndSubtractedResources =
    checkAndSubtractVillageResources(database, events);

  if (!hasSuccessfullyValidatedAndSubtractedResources) {
    notifyAboutEventCreationFailure(events);
    return;
  }

  insertEvents(database, events);
};

type CreateNewEventsArgs<T extends GameEventType> = Omit<
  GameEvent<T>,
  'id' | 'startsAt' | 'duration' | 'resolvesAt'
> & {
  amount?: number;
};

export const createEvents = <T extends GameEventType>(
  database: DbFacade,
  args: CreateNewEventsArgs<T>,
) => {
  // These type coercions are super hacky. Essentially, args is GameEvent<T> but without 'startsAt' and 'duration'.
  const startsAt = getEventStartTime(database, args as GameEvent<T>);
  const duration = getEventDuration(database, args as GameEvent<T>);

  const amount = args?.amount ?? 1;
  const events: GameEvent<T>[] = Array.from({ length: amount });

  for (let i = 0; i < amount; i += 1) {
    events[i] = {
      ...args,
      id: crypto.randomUUID(),
      startsAt: startsAt + i * duration,
      duration,
    } as GameEvent<T>;
  }

  validateAndInsertEvents(database, events);

  // Return true if any inserted event should resolve immediately (<= now).
  const now = Date.now();
  const createdImmediate = events.some((e) => e.startsAt + e.duration <= now);

  // Signal the scheduler that there are new immediate events. This is synchronous.
  // The scheduler will pick this up either in its current run (if it's active)
  // or on its next scan.
  if (createdImmediate) {
    markNeedsRescan();
  }

  return createdImmediate;
};
