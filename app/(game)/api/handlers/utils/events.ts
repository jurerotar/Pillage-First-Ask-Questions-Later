import type {
  GameEvent,
  GameEventType,
} from 'app/interfaces/models/game/game-event';
import type { Village } from 'app/interfaces/models/game/village';
import {
  isAdventurePointIncreaseEvent,
  isBuildingConstructionEvent,
  isBuildingLevelUpEvent,
  isEventWithResourceCost,
  isScheduledBuildingEvent,
  isTroopTrainingEvent,
  isUnitImprovementEvent,
  isUnitResearchEvent,
  isVillageEvent,
} from 'app/(game)/guards/event-guards';
import type { QueryClient } from '@tanstack/react-query';
import {
  effectsCacheKey,
  eventsCacheKey,
  playersCacheKey,
  preferencesCacheKey,
  serverCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { insertBulkEvent } from 'app/(game)/api/handlers/utils/event-insertion';
import {
  calculateBuildingCostForLevel,
  calculateBuildingDurationForLevel,
} from 'app/(game)/(village-slug)/utils/building';
import {
  calculateUnitResearchCost,
  calculateUnitResearchDuration,
  calculateUnitUpgradeCostForLevel,
  calculateUnitUpgradeDurationForLevel,
  getUnitData,
} from 'app/(game)/(village-slug)/utils/units';
import type { Effect } from 'app/interfaces/models/game/effect';
import { calculateComputedEffect } from 'app/(game)/utils/calculate-computed-effect';
import type { Player } from 'app/interfaces/models/game/player';
import type { Server } from 'app/interfaces/models/game/server';
import { calculateAdventurePointIncreaseEventDuration } from 'app/factories/utils/event';
import type { EventApiNotificationEvent } from 'app/interfaces/api';
import type { Preferences } from 'app/interfaces/models/game/preferences';
import {
  calculateVillageResourcesAt,
  subtractVillageResourcesAt,
} from 'app/(game)/api/utils/village';

// TODO: Implement this
export const notifyAboutEventCreationFailure = (events: GameEvent[]) => {
  console.error('Following events failed to create', events);

  const event = events[0];

  self.postMessage({
    eventKey: 'event:worker-event-creation-error',
    ...event,
  } satisfies EventApiNotificationEvent);
};

export const checkAndSubtractVillageResources = (
  queryClient: QueryClient,
  events: GameEvent[],
): boolean => {
  const { isDeveloperModeEnabled } = queryClient.getQueryData<Preferences>([
    preferencesCacheKey,
  ])!;

  // You can only create multiple events of the same type (e.g. training multiple same units), so to calculate cost, we can always take first event
  const event = events[0];

  const eventCost = getEventCost(event);

  if (!isDeveloperModeEnabled && isEventWithResourceCost(event)) {
    const { villageId, startsAt } = event;
    const [woodCost, clayCost, ironCost, wheatCost] = eventCost;
    const { currentWood, currentClay, currentIron, currentWheat } =
      calculateVillageResourcesAt(queryClient, villageId, startsAt);

    if (
      woodCost > currentWood ||
      clayCost > currentClay ||
      ironCost > currentIron ||
      wheatCost > currentWheat
    ) {
      return false;
    }

    subtractVillageResourcesAt(queryClient, villageId, startsAt, eventCost);
  }

  return true;
};

export const insertEvents = (queryClient: QueryClient, events: GameEvent[]) => {
  queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (prevEvents) => {
    return insertBulkEvent(prevEvents!, events);
  });
};

export const filterEventsByType = <T extends GameEventType>(
  events: GameEvent[],
  type: T,
  villageId: Village['id'],
): GameEvent<T>[] => {
  const result: GameEvent<T>[] = [];

  for (const event of events) {
    if (!isVillageEvent(event)) {
      continue;
    }

    if (event.type === type && event.villageId === villageId) {
      result.push(event as GameEvent<T>);
    }
  }

  return result;
};

export const getEventCost = (event: GameEvent): number[] => {
  if (isBuildingLevelUpEvent(event)) {
    const { buildingId, level } = event;
    const cost = calculateBuildingCostForLevel(buildingId, level);
    return cost;
  }

  if (isUnitResearchEvent(event)) {
    const { unitId } = event;
    const cost = calculateUnitResearchCost(unitId);
    return cost;
  }

  if (isUnitImprovementEvent(event)) {
    const { unitId, level } = event;
    const cost = calculateUnitUpgradeCostForLevel(unitId, level);
    return cost;
  }

  if (isTroopTrainingEvent(event)) {
    const { unitId, buildingId, amount } = event;
    const { baseRecruitmentCost } = getUnitData(unitId);

    const costModifier =
      buildingId === 'GREAT_BARRACKS' || buildingId === 'GREAT_STABLE' ? 3 : 1;

    return baseRecruitmentCost.map((cost) => cost * costModifier * amount);
  }

  return [0, 0, 0, 0];
};

export const getEventDuration = (
  queryClient: QueryClient,
  event: GameEvent,
): number => {
  const { isDeveloperModeEnabled } = queryClient.getQueryData<Preferences>([
    preferencesCacheKey,
  ])!;

  if (isBuildingLevelUpEvent(event) || isScheduledBuildingEvent(event)) {
    if (isDeveloperModeEnabled) {
      return 0;
    }

    const { villageId, buildingId, level } = event;

    const effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;
    const { total } = calculateComputedEffect(
      'buildingDuration',
      effects,
      villageId,
    );

    const baseBuildingDuration = calculateBuildingDurationForLevel(
      buildingId,
      level,
    );
    return baseBuildingDuration * total;
  }

  if (isBuildingConstructionEvent(event)) {
    return 0;
  }

  if (isUnitResearchEvent(event)) {
    if (isDeveloperModeEnabled) {
      return 0;
    }

    const { unitId } = event;
    return calculateUnitResearchDuration(unitId);
  }

  if (isUnitImprovementEvent(event)) {
    if (isDeveloperModeEnabled) {
      return 0;
    }

    const { unitId, level } = event;
    return calculateUnitUpgradeDurationForLevel(unitId, level);
  }

  if (isTroopTrainingEvent(event)) {
    const effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;
    const { unitId, villageId, durationEffectId } = event;
    const { total } = calculateComputedEffect(
      durationEffectId,
      effects,
      villageId,
    );

    if (isDeveloperModeEnabled) {
      return 5_000 * total;
    }

    const { baseRecruitmentDuration } = getUnitData(unitId);

    return total * baseRecruitmentDuration;
  }

  if (isAdventurePointIncreaseEvent(event)) {
    const server = queryClient.getQueryData<Server>([serverCacheKey])!;

    return calculateAdventurePointIncreaseEventDuration(server);
  }

  console.error('Missing duration calculation for event', event);
  return 0;
};

export const getEventStartTime = (
  queryClient: QueryClient,
  event: GameEvent,
): number => {
  if (isTroopTrainingEvent(event)) {
    const { villageId, buildingId } = event;
    const events = queryClient.getQueryData<GameEvent[]>([eventsCacheKey])!;

    const trainingEvents = filterEventsByType(
      events,
      'troopTraining',
      villageId,
    );

    const relevantTrainingEvents = trainingEvents.filter((event) => {
      return event.buildingId === buildingId;
    });

    if (relevantTrainingEvents.length > 0) {
      const lastEvent = relevantTrainingEvents.at(-1)!;
      return lastEvent.startsAt + lastEvent.duration;
    }

    return Date.now();
  }

  // TODO: Add queue for same unitId
  if (isUnitImprovementEvent(event)) {
    return Date.now();
  }

  if (isScheduledBuildingEvent(event)) {
    const { buildingFieldId, villageId } = event;

    const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;
    const { tribe } = players.find(({ id }) => id === 'player')!;

    const events = queryClient.getQueryData<GameEvent[]>([eventsCacheKey])!;

    const buildingLevelChangeEvents = filterEventsByType(
      events,
      'buildingLevelChange',
      villageId,
    );
    const buildingScheduledConstructionEvents = filterEventsByType(
      events,
      'buildingScheduledConstruction',
      villageId,
    );

    const buildingEvents = [
      ...buildingLevelChangeEvents,
      ...buildingScheduledConstructionEvents,
    ];

    if (tribe === 'romans') {
      const relevantEvents = buildingEvents.filter((event) => {
        if (buildingFieldId! <= 18) {
          return event.buildingFieldId <= 18;
        }

        return event.buildingFieldId > 18;
      });

      if (relevantEvents.length > 0) {
        const lastEvent = relevantEvents.at(-1)!;
        return lastEvent.startsAt + lastEvent.duration;
      }

      return Date.now();
    }

    if (buildingEvents.length > 0) {
      const lastEvent = buildingEvents.at(-1)!;
      return lastEvent.startsAt;
    }

    return Date.now();
  }

  if (isBuildingConstructionEvent(event) || isBuildingLevelUpEvent(event)) {
    return Date.now();
  }

  if (isAdventurePointIncreaseEvent(event)) {
    const { startsAt, duration } = event;

    return startsAt + duration;
  }

  return Date.now();
};
