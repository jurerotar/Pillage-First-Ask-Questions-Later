import type { ApiHandler } from 'app/interfaces/api';
import { eventsCacheKey, playersCacheKey, villagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { scheduleNextEvent } from 'app/(game)/api/utils/event-resolvers';
import { partition } from 'app/utils/common';
import { isBuildingEvent, isScheduledBuildingEvent, isVillageEvent } from 'app/(game)/guards/event-guards';
import { calculateBuildingCancellationRefundForLevel, specialFieldIds } from 'app/(game)/(village-slug)/utils/building';
import type { Village } from 'app/interfaces/models/game/village';
import { removeBuildingField } from 'app/(game)/api/handlers/resolvers/building-resolvers';
import { addVillageResourcesAt } from 'app/(game)/api/utils/village';
import type { Player } from 'app/interfaces/models/game/player';
import {
  checkAndSubtractVillageResources,
  insertEvents,
  notifyAboutEventCreationFailure,
} from 'app/(game)/api/handlers/utils/create-event';

export const getVillageEvents: ApiHandler<GameEvent[], 'villageId'> = async (queryClient, { params }) => {
  const { villageId: villageIdParam } = params;
  const villageId = Number.parseInt(villageIdParam);

  const events = queryClient.getQueryData<GameEvent[]>([eventsCacheKey])!;

  return events.filter((event) => {
    if (!isVillageEvent(event)) {
      return true;
    }

    return event.villageId === villageId;
  });
};

type CreateNewEventsBody = {
  events: GameEvent[];
};

export const createNewEvents: ApiHandler<void, '', CreateNewEventsBody> = async (queryClient, args) => {
  const {
    body: { events },
  } = args;

  const hasSuccessfullyValidatedAndSubtractedResources = checkAndSubtractVillageResources(queryClient, events);

  if (!hasSuccessfullyValidatedAndSubtractedResources) {
    notifyAboutEventCreationFailure();
    return;
  }

  insertEvents(queryClient, events);

  await scheduleNextEvent(queryClient);
};

export const cancelConstructionEvent: ApiHandler<void, 'eventId', void> = async (queryClient, args) => {
  const {
    params: { eventId },
  } = args;

  const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;
  const { tribe } = players.find(({ id }) => id === 'player')!;

  queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (prevEvents) => {
    const cancelledEvent = prevEvents!.find(({ id }) => eventId === id) as GameEvent<'buildingConstruction'>;

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
      queryClient.setQueryData<Village[]>([villagesCacheKey], (prevData) => {
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

    const [wood, clay, iron, wheat] = calculateBuildingCancellationRefundForLevel(buildingId, level);

    addVillageResourcesAt(queryClient, villageId, Date.now(), [wood, clay, iron, wheat]);

    return eventsToKeep;
  });

  await scheduleNextEvent(queryClient);
};
