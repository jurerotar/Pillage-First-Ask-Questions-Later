import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doesEventRequireResourceUpdate, isBuildingEvent, isScheduledBuildingEvent } from 'app/(game)/hooks/guards/event-guards';
import {
  buildingConstructionResolver,
  buildingDestructionResolver,
  buildingLevelChangeResolver,
  buildingScheduledConstructionEventResolver,
  removeBuildingField,
} from 'app/(game)/hooks/resolvers/building-resolvers';
import { troopTrainingEventResolver } from 'app/(game)/hooks/resolvers/troop-resolvers';
import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { useTribe } from 'app/(game)/hooks/use-tribe';
import { updateVillageResources } from 'app/(game)/hooks/utils/events';
import { getBuildingDataForLevel, specialFieldIds } from 'app/(game)/utils/building';
import { type GameEvent, GameEventType } from 'app/interfaces/models/events/game-event';
import type { Village } from 'app/interfaces/models/game/village';
import { partition } from 'app/utils/common';
import { eventsCacheKey, villagesCacheKey } from 'app/query-keys';

const MAX_BUILDINGS_IN_QUEUE = 5;

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
    case GameEventType.TROOP_TRAINING: {
      return troopTrainingEventResolver;
    }
  }
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

      if (doesEventRequireResourceUpdate(event)) {
      }
    },
  });

  const { mutate: cancelBuildingEvent } = useMutation<void, Error, GameEvent['id']>({
    mutationFn: async (id) => {
      queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (prevEvents) => {
        const cancelledEvent = prevEvents!.find(({ id: eventId }) => eventId === id) as GameEvent<GameEventType.BUILDING_LEVEL_CHANGE>;

        // If there's other building upgrades of same building, we need to cancel them as well
        const [eventsToRemove, eventsToKeep] = partition(prevEvents!, (event) => {
          if (!isBuildingEvent(event)) {
            return false;
          }

          return (
            cancelledEvent.villageId === event.villageId &&
            cancelledEvent.buildingFieldId === event.buildingFieldId &&
            cancelledEvent.startsAt <= event.startsAt
          );
        });

        const totalTimeToSubtract = eventsToRemove.reduce((accumulator, event) => {
          return accumulator + event.duration;
        }, 0);

        // There's always going to be at least one event, but if there's more, we take the last one, so that we can subtract the right amount
        const eventToRemove = eventsToRemove.at(-1) as GameEvent<GameEventType.BUILDING_LEVEL_CHANGE>;

        const { buildingFieldId, building, level, villageId, startsAt, duration } = eventToRemove;

        const buildingEvents = eventsToKeep.filter(isBuildingEvent);

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

        // If we're building a new building, construction takes place immediately, in that case we need to remove the building
        if (!specialFieldIds.includes(cancelledEvent.buildingFieldId) && cancelledEvent.level === 1) {
          queryClient.setQueryData<Village[]>([villagesCacheKey], (prevData) => {
            return removeBuildingField(prevData!, villageId, buildingFieldId);
          });
        }

        // Event can either be scheduled or already in action
        if (isScheduledBuildingEvent(eventToRemove)) {
          for (const event of eligibleEvents) {
            if (event.startsAt + event.duration >= startsAt + duration) {
              event.duration -= totalTimeToSubtract;
            }
          }

          return eventsToKeep;
        }

        // Event already in motion
        for (const event of eligibleEvents) {
          if (event.startsAt + event.duration >= startsAt + duration) {
            const difference = startsAt + totalTimeToSubtract - Date.now();
            event.startsAt -= difference;
          }
        }

        const { currentLevelResourceCost } = getBuildingDataForLevel(building.id, level);
        // Only return 80% of the resources
        const resourceChargeback = currentLevelResourceCost.map((cost) => Math.trunc(cost * 0.8));

        updateVillageResources(queryClient, villageId, resourceChargeback, 'add');

        return eventsToKeep;
      });
    },
  });

  const currentVillageBuildingEvents = events.filter((event) => {
    if (!isBuildingEvent(event)) {
      return false;
    }

    return event.villageId === currentVillageId;
  }) as GameEvent<GameEventType.BUILDING_CONSTRUCTION>[];

  const canAddAdditionalBuildingToQueue = currentVillageBuildingEvents.length < MAX_BUILDINGS_IN_QUEUE;

  return {
    events,
    resolveEvent,
    cancelBuildingEvent,
    currentVillageBuildingEvents,
    canAddAdditionalBuildingToQueue,
  };
};
