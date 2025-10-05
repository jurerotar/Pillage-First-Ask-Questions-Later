import type {
  GameEvent,
  GameEventType,
} from 'app/interfaces/models/game/game-event';
import type { Village } from 'app/interfaces/models/game/village';
import {
  isAdventurePointIncreaseEvent,
  isBuildingConstructionEvent,
  isBuildingDestructionEvent,
  isBuildingLevelUpEvent,
  isEventWithResourceCost,
  isScheduledBuildingEvent,
  isTroopTrainingEvent,
  isUnitImprovementEvent,
  isUnitResearchEvent,
  isVillageEvent,
} from 'app/(game)/guards/event-guards';
import type { QueryClient } from '@tanstack/react-query';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { insertBulkEvent } from 'app/(game)/api/handlers/utils/event-insertion';
import {
  calculateBuildingCostForLevel,
  calculateBuildingDurationForLevel,
} from 'app/assets/utils/buildings';
import {
  calculateUnitResearchCost,
  calculateUnitResearchDuration,
  calculateUnitUpgradeCostForLevel,
  calculateUnitUpgradeDurationForLevel,
  getUnitDefinition,
} from 'app/assets/utils/units';
import type { Effect } from 'app/interfaces/models/game/effect';
import { calculateComputedEffect } from 'app/(game)/utils/calculate-computed-effect';
import type { Server } from 'app/interfaces/models/game/server';
import { calculateAdventurePointIncreaseEventDuration } from 'app/factories/utils/event';
import type { EventApiNotificationEvent } from 'app/interfaces/api';
import {
  calculateVillageResourcesAt,
  subtractVillageResourcesAt,
} from 'app/(game)/api/utils/village';
import { getCurrentPlayer } from 'app/(game)/api/utils/player';
import type { DbFacade } from 'app/(game)/api/database-facade';
import { z } from 'zod';

const selectEffectsSqlStatement = `
  SELECT e.effect_id  AS id,
         e.value,
         e.type,
         e.scope,
         e.source,
         e.village_id AS villageId,
         e.source_specifier,
         CASE
           WHEN e.source = 'building'
             AND e.source_specifier BETWEEN 1 AND 40
             THEN bf.building_id
           END        AS buildingId
  FROM effects AS e
         LEFT JOIN building_fields AS bf
                   ON e.scope = 'village'
                     AND bf.village_id = e.village_id
                     AND bf.field_id = e.source_specifier
  WHERE e.effect_id = $effect_id
    AND e.scope IN ('global', 'server')
     OR e.village_id = $village_id;
`;

const effectsSchema = z
  .object({
    effect_id: z.string().brand<Effect['id']>(),
    value: z.number(),
    type: z.enum(['base', 'bonus', 'bonus-booster']),
    scope: z.enum(['server', 'global', 'village']),
    source: z.enum([
      'building',
      'artifact',
      'hero',
      'oasis',
      'tribe',
      'server',
      'troops',
    ]),
    village_id: z.number().nullable(),
    source_specifier: z.number().nullable(),
  })
  .transform((z) => {
    return {
      id: z.effect_id as Effect['id'],
      value: z.value,
      type: z.type,
      scope: z.scope,
      source: z.source,
      villageId: z.village_id,
      sourceSpecifier: z.source_specifier,
    };
  });

const effectsListSchema = z.array(effectsSchema);

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
  database: DbFacade,
  events: GameEvent[],
): boolean => {
  const isDeveloperModeEnabled = database.selectValue(
    'SELECT is_developer_mode_enabled FROM preferences;',
  );

  // You can only create multiple events of the same type (e.g. training multiple same units), so to calculate cost, we can always take first event
  const event = events[0];

  const eventCost = getEventCost(event);

  if (!isDeveloperModeEnabled && isEventWithResourceCost(event)) {
    const { villageId, startsAt } = event;
    const [woodCost, clayCost, ironCost, wheatCost] = eventCost;
    const { currentWood, currentClay, currentIron, currentWheat } =
      calculateVillageResourcesAt(database, villageId, startsAt);

    if (
      woodCost > currentWood ||
      clayCost > currentClay ||
      ironCost > currentIron ||
      wheatCost > currentWheat
    ) {
      return false;
    }

    subtractVillageResourcesAt(database, villageId, startsAt, eventCost);
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
    const { baseRecruitmentCost } = getUnitDefinition(unitId);

    const costModifier =
      buildingId === 'GREAT_BARRACKS' || buildingId === 'GREAT_STABLE' ? 3 : 1;

    return baseRecruitmentCost.map((cost) => cost * costModifier * amount);
  }

  return [0, 0, 0, 0];
};

export const getEventDuration = (
  database: DbFacade,
  event: GameEvent,
): number => {
  const isDeveloperModeEnabled = database.selectValue(
    ' SELECT is_developer_mode_enabled FROM preferences;',
  );

  if (isBuildingLevelUpEvent(event) || isScheduledBuildingEvent(event)) {
    if (isDeveloperModeEnabled) {
      return 0;
    }

    const { villageId, buildingId, level } = event;

    const rows = database.selectObjects(selectEffectsSqlStatement, {
      $effect_id: 'buildingDuration',
      $village_id: villageId,
    });

    const effects = effectsListSchema.parse(rows);

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

    const { villageId, unitId } = event;

    const rows = database.selectObjects(selectEffectsSqlStatement, {
      $effect_id: 'unitResearchDuration',
      $village_id: villageId,
    });

    const effects = effectsListSchema.parse(rows);

    const { total: unitResearchDurationModifier } = calculateComputedEffect(
      'unitResearchDuration',
      effects,
      villageId,
    );

    return unitResearchDurationModifier * calculateUnitResearchDuration(unitId);
  }

  if (isUnitImprovementEvent(event)) {
    if (isDeveloperModeEnabled) {
      return 0;
    }

    const { villageId, unitId, level } = event;

    const rows = database.selectObjects(selectEffectsSqlStatement, {
      $effect_id: 'unitImprovementDuration',
      $village_id: villageId,
    });

    const effects = effectsListSchema.parse(rows);

    const { total: unitImprovementDurationModifier } = calculateComputedEffect(
      'unitImprovementDuration',
      effects,
      villageId,
    );

    return (
      unitImprovementDurationModifier *
      calculateUnitUpgradeDurationForLevel(unitId, level)
    );
  }

  if (isTroopTrainingEvent(event)) {
    const { unitId, villageId, durationEffectId } = event;

    const rows = database.selectObjects(selectEffectsSqlStatement, {
      $effect_id: 'buildingDuration',
      $village_id: villageId,
    });

    const effects = effectsListSchema.parse(rows);

    const { total } = calculateComputedEffect(
      durationEffectId,
      effects,
      villageId,
    );

    if (isDeveloperModeEnabled) {
      return 5_000 * total;
    }

    const { baseRecruitmentDuration } = getUnitDefinition(unitId);

    return total * baseRecruitmentDuration;
  }

  if (isAdventurePointIncreaseEvent(event)) {
    const [createdAt, speed] = database.selectValues(
      'SELECT created_at, speed FROM servers LIMIT 1;',
    ) as [Server['createdAt'], Server['configuration']['speed']];

    return calculateAdventurePointIncreaseEventDuration(createdAt, speed);
  }

  if (isBuildingDestructionEvent(event)) {
    return 0;
  }

  console.error('Missing duration calculation for event', event);
  return 0;
};

export const getEventStartTime = (
  queryClient: QueryClient,
  database: DbFacade,
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

    const { tribe } = getCurrentPlayer(database);

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
