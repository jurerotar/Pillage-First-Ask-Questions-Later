import { z } from 'zod';
import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import type {
  GameEvent,
  GameEventType,
} from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { triggerKick } from '../http/events/scheduler/scheduler-signal';
import { selectNextEventQuery } from '../queries/event-queries';
import { postWorkerMessage } from '../worker/notification-port';
import {
  getEventCost,
  getEventDuration,
  getEventResourceSubtractionTimestamp,
  getEventStartTime,
  insertEvents,
  runEventCreationSideEffects,
  validateEventCreationPrerequisites,
  validateEventCreationResources,
} from './events';
import { subtractVillageResourcesAt } from './village';

type CreateNewEventsArgs<T extends GameEventType> = Omit<
  GameEvent<T>,
  'id' | 'resolvesAt' | 'startsAt' | 'duration'
> & {
  amount?: number;
  startsAt?: number;
  duration?: number;
};

const createEventsSchema = z.strictObject({
  id: z.number(),
  resolvesAt: z.number(),
});

export const createEvents = <T extends GameEventType>(
  database: DbFacade,
  args: CreateNewEventsArgs<T>,
) => {
  const sampleEvent = args as GameEvent<T>;
  let { startsAt = null, duration = null } = sampleEvent;
  const amount = args?.amount ?? 1;

  validateEventCreationPrerequisites(database, sampleEvent);

  const eventCost = getEventCost(database, sampleEvent);

  if (eventCost.some((cost) => cost > 0)) {
    const hasEnoughResources = validateEventCreationResources(
      database,
      sampleEvent,
      eventCost,
    );

    if (!hasEnoughResources) {
      throw new Error('Not enough resources');
    }

    startsAt ??= getEventStartTime(database, sampleEvent);
    const eventResourceSubtractionTimestamp =
      getEventResourceSubtractionTimestamp(database, sampleEvent, startsAt);

    const { villageId } = sampleEvent;

    subtractVillageResourcesAt(
      database,
      villageId!,
      eventResourceSubtractionTimestamp,
      eventCost,
    );
  }

  startsAt ??= getEventStartTime(database, sampleEvent);

  duration ??= Math.ceil(getEventDuration(database, sampleEvent));

  const events: GameEvent<T>[] = Array.from({ length: amount });

  for (let i = 0; i < amount; i += 1) {
    events[i] = {
      ...args,
      startsAt: startsAt + i * duration,
      duration,
      resolvesAt: startsAt + i * duration + duration,
    } as GameEvent<T>;
  }

  const earliestEvent = events.at(0)!;

  const now = Date.now();
  const newResolvesAt = events.map((e) => e.startsAt + e.duration);
  const earliestNewResolvesAt = earliestEvent.startsAt + earliestEvent.duration;

  // read current next event BEFORE we insert, using the same "now" snapshot
  const currentNext = database.selectObject({
    sql: selectNextEventQuery,
    bind: { $now: now },
    schema: createEventsSchema,
  });

  insertEvents(database, events);
  runEventCreationSideEffects(database, events);

  postWorkerMessage({
    eventKey: 'event:created',
    ...events[0],
  } satisfies EventApiNotificationEvent);

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
