import type { QueryClient } from '@tanstack/react-query';
import { calculateCurrentAmount } from 'app/(game)/(village-slug)/hooks/use-calculated-resource';
import { calculateComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { getVillageById } from 'app/(game)/(village-slug)/hooks/use-villages';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { PlayerVillage } from 'app/interfaces/models/game/village';
import type { GameEvent, GameEventType } from 'app/interfaces/models/game/game-event';
import { eventFactory } from 'app/factories/event-factory';
import { doesEventRequireResourceCheck } from 'app/(game)/(village-slug)/hooks/guards/event-guards';
import { effectsCacheKey, eventsCacheKey, playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

// To prevent constant resorting, events must be added to correct indexes, determined by their timestamp.
export const insertEvent = (events: GameEvent[], event: GameEvent): GameEvent[] => {
  const eventResolvesAt = event.startsAt + event.duration;

  // Find the correct insertion index
  const insertIndex = events.findIndex(({ startsAt, duration }) => {
    const existingResolvesAt = startsAt + duration;
    return eventResolvesAt < existingResolvesAt; // Insert before the first event that resolves later
  });

  // If no suitable position is found, append at the end
  return events.toSpliced(insertIndex === -1 ? events.length : insertIndex, 0, event);
};

// Make sure newEvents are already sorted. We avoid sorting to optimize performance.
export const insertBulkEvent = (events: GameEvent[], newEvents: GameEvent[]): GameEvent[] => {
  const result = new Array(events.length + newEvents.length); // Pre-allocate the result array

  // Pointer to keep track of the current index in the 'events' array
  let i = 0;
  // Pointer to keep track of the current index in the 'newEvents' array
  let j = 0;
  // Pointer to keep track of the current index in the 'result' array
  let k = 0;

  // Merge the arrays as before
  while (i < events.length && j < newEvents.length) {
    if (events[i].startsAt <= newEvents[j].startsAt) {
      result[k++] = events[i++];
    } else {
      result[k++] = newEvents[j++];
    }
  }

  // Copy remaining events from 'events' array
  while (i < events.length) {
    result[k++] = events[i++];
  }

  // Copy remaining events from 'newEvents' array
  while (j < newEvents.length) {
    result[k++] = newEvents[j++];
  }

  return result;
};

export const getCurrentVillageResources = (queryClient: QueryClient, villageId: PlayerVillage['id'], timestamp: number = Date.now()) => {
  const villages = queryClient.getQueryData<PlayerVillage[]>([playerVillagesCacheKey])!;
  const effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;
  const village = getVillageById(villages, villageId);
  const { id } = village;
  const { total: warehouseCapacity } = calculateComputedEffect('warehouseCapacity', effects, id);
  const { total: granaryCapacity } = calculateComputedEffect('granaryCapacity', effects, id);
  const { total: woodProduction } = calculateComputedEffect('woodProduction', effects, id);
  const { total: clayProduction } = calculateComputedEffect('clayProduction', effects, id);
  const { total: ironProduction } = calculateComputedEffect('ironProduction', effects, id);
  const { total: wheatProduction } = calculateComputedEffect('wheatProduction', effects, id);

  const { currentAmount: currentWood } = calculateCurrentAmount({
    village,
    resource: 'wood',
    hourlyProduction: woodProduction,
    storageCapacity: warehouseCapacity,
    timestamp,
  });
  const { currentAmount: currentClay } = calculateCurrentAmount({
    village,
    resource: 'clay',
    hourlyProduction: clayProduction,
    storageCapacity: warehouseCapacity,
    timestamp,
  });
  const { currentAmount: currentIron } = calculateCurrentAmount({
    village,
    resource: 'iron',
    hourlyProduction: ironProduction,
    storageCapacity: warehouseCapacity,
    timestamp,
  });
  const { currentAmount: currentWheat } = calculateCurrentAmount({
    village,
    resource: 'wheat',
    hourlyProduction: wheatProduction,
    storageCapacity: granaryCapacity,
    timestamp,
  });

  return {
    currentWood,
    currentIron,
    currentClay,
    currentWheat,
    warehouseCapacity,
    granaryCapacity,
  };
};

export const updateVillageResources = (
  queryClient: QueryClient,
  villageId: PlayerVillage['id'],
  [wood, clay, iron, wheat]: number[],
  mode: 'add' | 'subtract',
) => {
  const { currentWood, currentClay, currentIron, currentWheat, warehouseCapacity, granaryCapacity } = getCurrentVillageResources(
    queryClient,
    villageId,
  );

  const newLastUpdatedAt = Date.now();

  queryClient.setQueryData<PlayerVillage[]>([playerVillagesCacheKey], (prevVillages) => {
    return prevVillages!.map((village) => {
      if (village.id !== villageId) {
        return village;
      }

      if (mode === 'add') {
        return {
          ...village,
          resources: {
            wood: Math.min(currentWood + wood, warehouseCapacity),
            clay: Math.min(currentClay + clay, warehouseCapacity),
            iron: Math.min(currentIron + iron, warehouseCapacity),
            wheat: Math.min(currentWheat + wheat, granaryCapacity),
          },
          lastUpdatedAt: newLastUpdatedAt,
        };
      }

      return {
        ...village,
        resources: {
          wood: Math.max(currentWood - wood, 0),
          clay: Math.max(currentClay - clay, 0),
          iron: Math.max(currentIron - iron, 0),
          wheat: Math.max(currentWheat - wheat, 0),
        },
        lastUpdatedAt: newLastUpdatedAt,
      };
    });
  });
};

type CreateEventFnHooks<T extends GameEventType> = {
  onSuccess?: (queryClient: QueryClient, args: CreateEventFnArgs<T> | CreateBulkEventArgs<T>) => void;
  onFailure?: (queryClient: QueryClient, args: CreateEventFnArgs<T> | CreateBulkEventArgs<T>) => void;
};

type CreateEventFnArgs<T extends GameEventType> = Omit<GameEvent<T>, 'id'> & CreateEventFnHooks<T>;

export type CreateEventArgs<T extends GameEventType> = Omit<Omit<GameEvent<T>, 'id'>, 'type' | 'villageId'> &
  CreateEventFnHooks<T> & {
    type?: GameEventType;
    villageId?: PlayerVillage['id'];
  };

export type CreateBulkEventArgs<T extends GameEventType> = CreateEventArgs<T> & {
  amount: number;
};

export const createEventFn = async <T extends GameEventType>(queryClient: QueryClient, args: CreateEventFnArgs<T>): Promise<void> => {
  const { onSuccess, onFailure, startsAt } = args;
  const event: GameEvent<T> = eventFactory<T>(args);

  if (doesEventRequireResourceCheck(event)) {
    const { resourceCost, villageId } = event;

    const { currentWood, currentClay, currentIron, currentWheat } = getCurrentVillageResources(queryClient, villageId, startsAt);

    const [woodCost, clayCost, ironCost, wheatCost] = resourceCost;
    if (woodCost > currentWood || clayCost > currentClay || ironCost > currentIron || wheatCost > currentWheat) {
      onFailure?.(queryClient, args);
      return;
    }

    updateVillageResources(queryClient, villageId, resourceCost, 'subtract');
  }

  queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (previousEvents) => insertEvent(previousEvents!, event));
  onSuccess?.(queryClient, args);
};
