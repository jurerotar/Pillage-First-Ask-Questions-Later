import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  doesEventRequireResourceUpdate,
  isBuildingEvent,
  isScheduledBuildingEvent,
} from 'app/(game)/(village-slug)/hooks/guards/event-guards';
import {
  buildingConstructionResolver,
  buildingDestructionResolver,
  buildingLevelChangeResolver,
  buildingScheduledConstructionEventResolver,
  removeBuildingField,
} from 'app/(game)/(village-slug)/hooks/resolvers/building-resolvers';
import { troopTrainingEventResolver } from 'app/(game)/(village-slug)/hooks/resolvers/troop-resolvers';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { updateVillageResources } from 'app/(game)/(village-slug)/hooks/utils/events';
import { calculateBuildingCancellationRefundForLevel, specialFieldIds } from 'app/(game)/(village-slug)/utils/building';
import type { GameEvent, GameEventType } from 'app/interfaces/models/game/game-event';
import type { Village } from 'app/interfaces/models/game/village';
import { partition } from 'app/utils/common';
import { eventsCacheKey, playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { adventurePointIncreaseResolver } from 'app/(game)/(village-slug)/hooks/resolvers/adventure-resolvers';
import { troopMovementResolver } from 'app/(game)/(village-slug)/hooks/resolvers/troop-movement-resolvers';

const gameEventTypeToResolverFunctionMapper = (gameEventType: GameEventType) => {
  switch (gameEventType) {
    case 'buildingLevelChange': {
      return buildingLevelChangeResolver;
    }
    case 'buildingConstruction': {
      return buildingConstructionResolver;
    }
    case 'buildingDestruction': {
      return buildingDestructionResolver;
    }
    case 'buildingScheduledConstruction': {
      return buildingScheduledConstructionEventResolver;
    }
    case 'troopTraining': {
      return troopTrainingEventResolver;
    }
    case 'adventurePointIncrease': {
      return adventurePointIncreaseResolver;
    }
    case 'troopMovement': {
      return troopMovementResolver;
    }
    default: {
      return console.error('No resolver function set for event type', gameEventType);
    }
  }
};

export const useEvents = () => {
  const queryClient = useQueryClient();
  const { tribe } = useTribe();

  const { data: events } = useQuery<GameEvent[]>({
    queryKey: [eventsCacheKey],
    initialData: [],
  });

  const { mutate: resolveEvent } = useMutation<void, Error, GameEvent['id']>({
    mutationFn: async (id) => {
      const event = events!.find(({ id: eventIdToFind }) => eventIdToFind === id)!;
      const resolver = gameEventTypeToResolverFunctionMapper(event.type);
      // If event updates any village property (new building, returning troops,...) we need to calculate the amount of resources before
      // said update happens
      if (doesEventRequireResourceUpdate(event, event.type)) {
        // If we pass [0, 0, 0, 0], it's just updated to current amount
        updateVillageResources(queryClient, event.villageId, [0, 0, 0, 0], 'add');
      }
      // @ts-expect-error - This one can't be solved, resolver returns every possible GameEvent option
      await resolver(queryClient, event);
      queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (prevEvents) => prevEvents!.filter(({ id: eventId }) => eventId !== id));
    },
  });

  const { mutate: cancelBuildingEvent } = useMutation<void, Error, GameEvent['id']>({
    mutationFn: async (id) => {
      queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (prevEvents) => {
        const cancelledEvent = prevEvents!.find(({ id: eventId }) => eventId === id) as GameEvent<'buildingConstruction'>;

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
        const eventToRemove = eventsToRemove.at(-1) as GameEvent<'buildingConstruction'>;

        const { buildingFieldId, buildingId, level, villageId, startsAt, duration } = eventToRemove;

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
          queryClient.setQueryData<Village[]>([playerVillagesCacheKey], (prevData) => {
            return removeBuildingField(prevData!, cancelledEvent);
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

        const resourceRefund = calculateBuildingCancellationRefundForLevel(buildingId, level);

        updateVillageResources(queryClient, villageId, resourceRefund, 'add');

        return eventsToKeep;
      });
    },
  });

  return {
    events,
    resolveEvent,
    cancelBuildingEvent,
  };
};
