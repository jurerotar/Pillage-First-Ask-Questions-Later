import type { QueryClient } from '@tanstack/react-query';
import type { GameEvent, GameEventType } from 'app/interfaces/models/game/game-event';
import { eventsCacheKey, preferencesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { insertBulkEvent } from 'app/(game)/api/handlers/utils/event-insertion';
import { eventFactory } from 'app/factories/event-factory';
import {
  isBuildingLevelUpEvent,
  isEventWithResourceCost,
  isTroopTrainingEvent,
  isUnitImprovementEvent,
  isUnitResearchEvent,
} from 'app/(game)/guards/event-guards';
import { calculateVillageResourcesAt, subtractVillageResourcesAt } from 'app/(game)/api/utils/village';
import type { ApiNotificationEvent } from 'app/interfaces/api';
import type { Preferences } from 'app/interfaces/models/game/preferences';
import { calculateBuildingCostForLevel } from 'app/(game)/(village-slug)/utils/building';
import { calculateUnitResearchCost, calculateUnitUpgradeCostForLevel, getUnitData } from 'app/(game)/(village-slug)/utils/units';

export const insertEvents = (queryClient: QueryClient, events: GameEvent[]) => {
  queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (prevEvents) => {
    return insertBulkEvent(prevEvents!, events);
  });
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

    const costModifier = buildingId === 'GREAT_BARRACKS' || buildingId === 'GREAT_STABLE' ? 3 : 1;

    return baseRecruitmentCost.map((cost) => cost * costModifier * amount);
  }

  return [0, 0, 0, 0];
};

// TODO: Implement this
export const notifyAboutEventCreationFailure = () => {
  self.postMessage({ eventKey: 'event:construction-not-started' } satisfies ApiNotificationEvent);
};

export const checkAndSubtractVillageResources = (queryClient: QueryClient, events: GameEvent[]): boolean => {
  const { isDeveloperModeEnabled } = queryClient.getQueryData<Preferences>([preferencesCacheKey])!;

  // You can only create multiple events of the same type (e.g. training multiple same units), so to calculate cost, we can always take first event
  const event = events[0];

  const eventCost = getEventCost(event);

  if (!isDeveloperModeEnabled && isEventWithResourceCost(event)) {
    const { villageId, startsAt } = event;
    const [woodCost, clayCost, ironCost, wheatCost] = eventCost;
    const { currentWood, currentClay, currentIron, currentWheat } = calculateVillageResourcesAt(queryClient, villageId, startsAt);

    if (woodCost > currentWood || clayCost > currentClay || ironCost > currentIron || wheatCost > currentWheat) {
      return false;
    }

    subtractVillageResourcesAt(queryClient, villageId, startsAt, eventCost);
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
