import { z } from 'zod';
import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import { createEventDtoSchema } from '@pillage-first/types/dtos/event';
import type {
  GameEvent,
  GameEventType,
} from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import type { EventCreationArgs } from '../http/events/resolver';
import { getEventResolver } from '../http/events/resolver-registry';
import { triggerKick } from '../http/events/scheduler/scheduler-signal';
import { selectNextEventQuery } from '../queries/event-queries';
import {
  areWorkerNotificationsEnabled,
  postWorkerMessage,
} from '../worker/notification-port';
import { getVillageTileId, subtractResourceSiteResourcesAt } from './village';

const createEventsSchema = z.strictObject({
  id: z.number(),
  resolvesAt: z.number(),
});

export const createEvents = <T extends GameEventType>(
  database: DbFacade,
  args: EventCreationArgs<T>,
) => {
  const parsedArgs = createEventDtoSchema.parse(args);

  let { startsAt, duration } = parsedArgs;
  const now = Date.now();

  const resolver = getEventResolver(parsedArgs.type).create(
    database,
    parsedArgs,
  );

  resolver.validate(now);

  const eventCost = resolver.cost();

  if (eventCost.some((cost) => cost > 0)) {
    startsAt ??= resolver.startTime();
    const eventResourceSubtractionTimestamp = resolver.chargeAt(startsAt);

    const { villageId } = parsedArgs;
    const [woodCost, clayCost, ironCost, wheatCost] = eventCost;

    subtractResourceSiteResourcesAt(
      database,
      getVillageTileId(database, villageId!),
      eventResourceSubtractionTimestamp,
      ({ currentWood, currentClay, currentIron, currentWheat }) => {
        if (
          woodCost > currentWood ||
          clayCost > currentClay ||
          ironCost > currentIron ||
          wheatCost > currentWheat
        ) {
          throw new Error('Not enough resources');
        }

        return eventCost;
      },
    );
  }

  startsAt ??= resolver.startTime();
  duration ??= Math.ceil(resolver.duration(startsAt));

  // read current next event BEFORE we insert, using the same "now" snapshot
  const currentNext = database.selectObject({
    sql: selectNextEventQuery,
    bind: { $now: now },
    schema: createEventsSchema,
  });

  const events = resolver.insert(startsAt, duration, now);
  const [earliestEvent] = events;

  if (areWorkerNotificationsEnabled()) {
    postWorkerMessage({
      eventKey: 'event:created',
      ...(earliestEvent as GameEvent),
      // Creating events doesn't require this, because cache invalidation is already done by the frontend
      affectedVillageIds: [],
      affectedTileIds: [],
    } satisfies EventApiNotificationEvent);
  }

  const createdImmediate = events.some((event) => event.resolvesAt <= now);

  if (
    createdImmediate ||
    !currentNext ||
    earliestEvent.resolvesAt < currentNext.resolvesAt
  ) {
    triggerKick();
  }
};
