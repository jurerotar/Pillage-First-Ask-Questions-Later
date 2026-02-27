import { z } from 'zod';
import type {
  GameEvent,
  GameEventType,
} from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { triggerKick } from '../../scheduler/scheduler-signal';
import { subtractVillageResourcesAt } from '../../utils/village.ts';
import {
  getEventCost,
  getEventDuration,
  getEventStartTime,
  insertEvents,
  notifyAboutEventCreationFailure,
  runEventCreationSideEffects,
  validateEventCreationPrerequisites,
  validateEventCreationResources,
} from './events';

type CreateNewEventsArgs<T extends GameEventType> = Omit<
  GameEvent<T>,
  'id' | 'startsAt' | 'duration' | 'resolvesAt'
> & {
  amount?: number;
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
  let startsAt: number | null = null;

  const [isEventAllowed, reason] = validateEventCreationPrerequisites(
    database,
    sampleEvent,
  );

  if (!isEventAllowed) {
    notifyAboutEventCreationFailure(reason);
    return;
  }

  const eventCost = getEventCost(database, sampleEvent);

  if (eventCost.some((cost) => cost > 0)) {
    const hasEnoughResources = validateEventCreationResources(
      database,
      sampleEvent,
      eventCost,
    );

    if (!hasEnoughResources) {
      notifyAboutEventCreationFailure('Not enough resources');
      return;
    }

    startsAt = getEventStartTime(database, sampleEvent);
    const { villageId } = sampleEvent;

    subtractVillageResourcesAt(database, villageId, startsAt, eventCost);
  }

  if (!startsAt) {
    startsAt = getEventStartTime(database, sampleEvent);
  }

  const duration = Math.ceil(getEventDuration(database, sampleEvent));

  const amount = args?.amount ?? 1;
  const events: GameEvent<T>[] = Array.from({ length: amount });

  for (let i = 0; i < amount; i += 1) {
    events[i] = {
      ...args,
      startsAt: startsAt + i * duration,
      duration,
    } as GameEvent<T>;
  }

  const earliestEvent = events.at(0)!;

  const now = Date.now();
  const newResolvesAt = events.map((e) => e.startsAt + e.duration);
  const earliestNewResolvesAt = earliestEvent.startsAt + earliestEvent.duration;

  // read current next event BEFORE we insert, using the same "now" snapshot
  const currentNext = database.selectObject({
    sql: `
      SELECT id, resolves_at AS resolvesAt
      FROM
        events
      WHERE
        resolves_at > $now
      ORDER BY
        resolves_at
      LIMIT 1;
    `,
    bind: { $now: now },
    schema: createEventsSchema,
  });

  insertEvents(database, events);
  runEventCreationSideEffects(database, events);

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
