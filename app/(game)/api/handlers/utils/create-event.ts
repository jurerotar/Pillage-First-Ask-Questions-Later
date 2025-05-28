import type { QueryClient } from '@tanstack/react-query';
import type { GameEvent, GameEventType } from 'app/interfaces/models/game/game-event';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { insertBulkEvent } from 'app/(game)/api/handlers/utils/event-insertion';
import { eventFactory } from 'app/factories/event-factory';
import { isEventWithResourceCost, isScheduledBuildingEvent } from 'app/(game)/guards/event-guards';
import { calculateVillageResourcesAt, subtractVillageResourcesAt } from 'app/(game)/api/utils/village';

export const insertEvents = (queryClient: QueryClient, events: GameEvent[]) => {
  queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (prevEvents) => {
    return insertBulkEvent(prevEvents!, events);
  });
};

// TODO: Implement this
export const notifyAboutEventCreationFailure = () => {};

export const checkAndSubtractVillageResources = (queryClient: QueryClient, events: GameEvent[]): boolean => {
  // You can only create multiple events of the same type (e.g. training multiple same units), so to calculate cost, we can always take first event
  const event = events[0];

  // Scheduled building event checks and subtract
  if (isEventWithResourceCost(event) && !isScheduledBuildingEvent(event)) {
    const amount = events.length;
    const { villageId, resourceCost, startsAt } = event;

    const fullResourceCost = resourceCost.map((cost) => cost * amount);
    const [woodCost, clayCost, ironCost, wheatCost] = fullResourceCost;

    const { currentWood, currentClay, currentIron, currentWheat } = calculateVillageResourcesAt(queryClient, villageId, startsAt);

    if (woodCost > currentWood || clayCost > currentClay || ironCost > currentIron || wheatCost > currentWheat) {
      return false;
    }

    subtractVillageResourcesAt(queryClient, villageId, startsAt, fullResourceCost);
  }

  return true;
};

// This function is used for events created on the server. "createNewEvents" is used for client-sent events.
export const createEvent = <T extends GameEventType>(queryClient: QueryClient, args: Omit<GameEvent<T>, 'id'>) => {
  const events = [eventFactory<T>(args)];

  const hasSuccessfullyValidatedAndSubtractedResources = checkAndSubtractVillageResources(queryClient, events);

  if (!hasSuccessfullyValidatedAndSubtractedResources) {
    notifyAboutEventCreationFailure();
    return;
  }

  insertEvents(queryClient, events);
};
