import type {
  GameEvent,
  GameEventType,
} from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { triggerKick } from '../../scheduler/scheduler-signal';
import {
  checkAndSubtractVillageResources,
  getEventDuration,
  getEventStartTime,
  insertEvents,
  notifyAboutEventCreationFailure,
} from './events';

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
      startsAt: startsAt + i * duration,
      duration,
    } as GameEvent<T>;
  }

  const now = Date.now();
  const newResolvesAt = events.map((e) => e.startsAt + e.duration);
  const earliestNewResolvesAt = events[0].startsAt + events[0].duration;

  // read current next event BEFORE we insert, using the same "now" snapshot
  const currentNext = database.selectObject(
    `
      SELECT id, resolves_at as resolvesAt
      FROM events
      WHERE resolves_at > $now
      ORDER BY resolves_at
      LIMIT 1;
    `,
    { $now: now },
  ) as { id: string; resolvesAt: number } | undefined;

  validateAndInsertEvents(database, events);

  // Determine if any created events should already be resolved
  const createdImmediate = newResolvesAt.some((r) => r <= now);

  if (createdImmediate) {
    // immediate -> we want scheduler to process RIGHT AWAY
    triggerKick();
  }

  // if earliestNewResolvesAt < currentNext.resolvesAt -> kick now:
  if (!currentNext || earliestNewResolvesAt < currentNext.resolvesAt) {
    triggerKick();
  }
};
