import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isBuildingEvent, isScheduledBuildingEvent } from 'app/[game]/hooks/guards/event-guards';
import { calculateCurrentAmount } from 'app/[game]/hooks/use-calculated-resource';
import { calculateComputedEffect } from 'app/[game]/hooks/use-computed-effect';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { effectsCacheKey } from 'app/[game]/hooks/use-effects';
import { useTribe } from 'app/[game]/hooks/use-tribe';
import { getVillageById, villagesCacheKey } from 'app/[game]/hooks/use-villages';
import {
  buildingConstructionResolver,
  buildingDestructionResolver,
  buildingLevelChangeResolver,
  buildingScheduledConstructionEventResolver,
} from 'app/[game]/resolvers/building-resolvers';
import { getBuildingDataForLevel } from 'app/[game]/utils/building';
import { doesEventRequireResourceCheck } from 'app/[game]/utils/guards/event-guards';
import { eventFactory } from 'app/factories/event-factory';
import { type GameEvent, GameEventType } from 'interfaces/models/events/game-event';
import type { Effect } from 'interfaces/models/game/effect';
import type { Village } from 'interfaces/models/game/village';

export const eventsCacheKey = 'events';

const MAX_BUILDINGS_IN_QUEUE = 5;

// To prevent constant resorting, events must be added to correct indexes, determined by their timestamp.
export const insertEvent = (previousEvents: GameEvent[], event: GameEvent): GameEvent[] => {
  const events: GameEvent[] = [...previousEvents];
  const lastIndex = events.findLastIndex(({ resolvesAt }) => event.resolvesAt >= resolvesAt);
  events.splice(lastIndex === -1 ? events.length : lastIndex + 1, 0, event);
  return events;
};

const gameEventTypeToResolverFunctionMapper = (gameEventType: GameEventType) => {
  switch (gameEventType) {
    case GameEventType.BUILDING_LEVEL_CHANGE: {
      return buildingLevelChangeResolver;
    }
    case GameEventType.BUILDING_CONSTRUCTION: {
      return buildingConstructionResolver;
    }
    case GameEventType.BUILDING_DESTRUCTION: {
      return buildingDestructionResolver;
    }
    case GameEventType.BUILDING_SCHEDULED_CONSTRUCTION: {
      return buildingScheduledConstructionEventResolver;
    }
  }
};

const getCurrentVillageResources = (queryClient: QueryClient, villageId: Village['id']) => {
  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;
  const effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;
  const { lastUpdatedAt, resources, id } = getVillageById(villages, villageId);
  const { total: warehouseCapacity } = calculateComputedEffect('warehouseCapacity', effects, id);
  const { total: granaryCapacity } = calculateComputedEffect('granaryCapacity', effects, id);
  const { total: woodProduction } = calculateComputedEffect('woodProduction', effects, id);
  const { total: clayProduction } = calculateComputedEffect('clayProduction', effects, id);
  const { total: ironProduction } = calculateComputedEffect('ironProduction', effects, id);
  const { total: wheatProduction } = calculateComputedEffect('wheatProduction', effects, id);

  const { currentAmount: currentWood } = calculateCurrentAmount({
    lastUpdatedAt,
    resourceAmount: resources.wood,
    hourlyProduction: woodProduction,
    storageCapacity: warehouseCapacity,
  });
  const { currentAmount: currentClay } = calculateCurrentAmount({
    lastUpdatedAt,
    resourceAmount: resources.clay,
    hourlyProduction: clayProduction,
    storageCapacity: warehouseCapacity,
  });
  const { currentAmount: currentIron } = calculateCurrentAmount({
    lastUpdatedAt,
    resourceAmount: resources.iron,
    hourlyProduction: ironProduction,
    storageCapacity: warehouseCapacity,
  });
  const { currentAmount: currentWheat } = calculateCurrentAmount({
    lastUpdatedAt,
    resourceAmount: resources.wheat,
    hourlyProduction: wheatProduction,
    storageCapacity: granaryCapacity,
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

const updateVillageResources = (
  queryClient: QueryClient,
  villageId: Village['id'],
  [wood, clay, iron, wheat]: number[],
  mode: 'add' | 'subtract',
) => {
  const { currentWood, currentClay, currentIron, currentWheat, warehouseCapacity, granaryCapacity } = getCurrentVillageResources(
    queryClient,
    villageId,
  );

  const newLastUpdatedAt = Date.now();

  queryClient.setQueryData<Village[]>([villagesCacheKey], (prevVillages) => {
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

export const useEvents = () => {
  const queryClient = useQueryClient();
  const { tribe } = useTribe();
  const { currentVillageId } = useCurrentVillage();

  const { data: events } = useQuery<GameEvent[]>({
    queryKey: [eventsCacheKey],
    initialData: [],
  });

  const { mutate: resolveEvent } = useMutation<void, Error, GameEvent['id']>({
    mutationFn: async (id) => {
      const event = events!.find(({ id: eventIdToFind }) => eventIdToFind === id)!;
      const resolver = gameEventTypeToResolverFunctionMapper(event.type);
      // @ts-expect-error - Each event has all required properties to resolve the event, we check this on event creation
      await resolver(event, queryClient);
      queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (prevEvents) => prevEvents!.filter(({ id: eventId }) => eventId !== id));
    },
  });

  const { mutate: cancelBuildingEvent } = useMutation<void, Error, GameEvent['id']>({
    mutationFn: async (id) => {
      queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (prevEvents) => {
        const eventToRemove = prevEvents!.find((event) => event.id === id)! as GameEvent<GameEventType.BUILDING_LEVEL_CHANGE>;
        const { buildingFieldId, building, level, villageId } = eventToRemove;

        const filteredEvents = prevEvents!.filter(({ id: eventId }) => eventId !== id);

        const buildingEvents = filteredEvents.filter(isBuildingEvent);

        // Romans effectively have 2 queues, so we only limit ourselves to the relevant one
        const eligibleEvents =
          tribe === 'romans'
            ? buildingEvents.filter((event) => {
                if (buildingFieldId! <= 18) {
                  return event.buildingFieldId <= 18;
                }

                return event.buildingFieldId > 18;
              })
            : buildingEvents;

        // Event can either be scheduled or already in action
        if (isScheduledBuildingEvent(eventToRemove)) {
          const { startAt, duration } = eventToRemove;

          for (const event of eligibleEvents) {
            if (event.resolvesAt >= startAt + duration) {
              event.resolvesAt -= duration;

              if (isScheduledBuildingEvent(event)) {
                event.startAt -= duration;
              }
            }
          }

          return filteredEvents;
        }

        // Events already in motion
        for (const event of eligibleEvents) {
          if (event.resolvesAt >= eventToRemove.resolvesAt) {
            const difference = eventToRemove.resolvesAt - Date.now();
            event.resolvesAt -= difference;
            if (isScheduledBuildingEvent(event)) {
              event.startAt -= difference;
            }
          }
        }

        const { currentLevelResourceCost } = getBuildingDataForLevel(building.id, level);
        // Only return 80% of the resources
        const resourceChargeback = currentLevelResourceCost.map((cost) => Math.trunc(cost * 0.8));

        updateVillageResources(queryClient, villageId, resourceChargeback, 'add');

        return filteredEvents;
      });
    },
  });

  const currentVillageBuildingEvents = events.filter((event) => {
    if (!isBuildingEvent(event)) {
      return false;
    }

    return event.villageId === currentVillageId;
  }) as (
    | GameEvent<GameEventType.BUILDING_CONSTRUCTION>
    | GameEvent<GameEventType.BUILDING_LEVEL_CHANGE>
    | GameEvent<GameEventType.BUILDING_SCHEDULED_CONSTRUCTION>
  )[];

  const canAddAdditionalBuildingToQueue = currentVillageBuildingEvents.length <= MAX_BUILDINGS_IN_QUEUE;

  return {
    events,
    resolveEvent,
    cancelBuildingEvent,
    currentVillageBuildingEvents,
    canAddAdditionalBuildingToQueue,
  };
};

type CreateEventFnArgs<T extends GameEventType> = Omit<GameEvent<T>, 'id'> & {
  onSuccess?: (queryClient: QueryClient, args: CreateEventFnArgs<T>) => void;
  onFailure?: (queryClient: QueryClient, args: CreateEventFnArgs<T>) => void;
};

export const createEventFn = async <T extends GameEventType>(queryClient: QueryClient, args: CreateEventFnArgs<T>): Promise<void> => {
  const { villageId, onSuccess, onFailure } = args;
  const event: GameEvent<T> = eventFactory<T>(args);

  if (doesEventRequireResourceCheck(event)) {
    const { resourceCost } = event;

    const { currentWood, currentClay, currentIron, currentWheat } = getCurrentVillageResources(queryClient, villageId);

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

type CreateEventArgs<T extends GameEventType> = Omit<CreateEventFnArgs<T>, 'villageId' | 'type'>;

export const useCreateEvent = <T extends GameEventType>(eventType: T) => {
  const queryClient = useQueryClient();
  const { currentVillageId } = useCurrentVillage();

  const { mutate: createEvent } = useMutation<void, Error, CreateEventArgs<T>>({
    mutationFn: async (args) => {
      // @ts-expect-error - TODO: Event definition is kinda garbage, but I've no clue how to fix it
      await createEventFn<T>(queryClient, {
        ...args,
        type: eventType,
        villageId: currentVillageId,
      });
    },
  });

  return createEvent;
};
