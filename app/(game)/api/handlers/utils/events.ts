import type { GameEvent } from 'app/interfaces/models/game/game-event';
import {
  isAdventurePointIncreaseEvent,
  isBuildingConstructionEvent,
  isBuildingDestructionEvent,
  isBuildingLevelUpEvent,
  isScheduledBuildingEvent,
  isTroopTrainingEvent,
  isUnitImprovementEvent,
  isUnitResearchEvent,
} from 'app/(game)/guards/event-guards';
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
import { calculateComputedEffect } from 'app/(game)/utils/calculate-computed-effect';
import type { Server } from 'app/interfaces/models/game/server';
import { calculateAdventurePointIncreaseEventDuration } from 'app/(game)/api/handlers/resolvers/utils/adventures';
import type { EventApiNotificationEvent } from 'app/interfaces/api';
import {
  calculateVillageResourcesAt,
  subtractVillageResourcesAt,
} from 'app/(game)/api/utils/village';
import { getCurrentPlayer } from 'app/(game)/api/utils/player';
import type { DbFacade } from 'app/(game)/api/database-facade';
import { selectAllRelevantEffectsByIdQuery } from 'app/(game)/api/utils/queries/effect-queries';
import { effectSchema } from 'app/(game)/api/utils/zod/effect-schemas';
import { z } from 'zod';
import {
  selectAllVillageEventsByTypeQuery,
  selectVillageBuildingEventsQuery,
} from 'app/(game)/api/utils/queries/event-queries';
import { eventSchema } from 'app/(game)/api/utils/zod/event-schemas';
import type { SQLOutputValue } from 'node:sqlite';

const effectsListSchema = z.array(effectSchema);
const eventsListSchema = z.array(eventSchema);

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
  const [event] = events;

  const eventCost = getEventCost(event);

  if (!isDeveloperModeEnabled && eventCost.some((cost) => cost > 0)) {
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

export const insertEvents = (database: DbFacade, events: GameEvent[]) => {
  const requiredEventProperties = new Set([
    'id',
    'type',
    'startsAt',
    'duration',
    'villageId',
  ]);
  // We add + 1 for the `meta` column
  const amountOfColumnsToInsert = requiredEventProperties.size + 1;

  const sqlTemplate = `
    INSERT INTO events (id, type, starts_at, duration, village_id, meta)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const amountOfEvents = events.length;

  const sql = `${sqlTemplate}${',(?, ?, ?, ?, ?, ?)'.repeat(amountOfEvents - 1)};`;

  const params: SQLOutputValue[] = Array.from({
    length: events.length * amountOfColumnsToInsert,
  });

  // We intentionally skip object destructuring assignment in favor of this manual approach,
  // due to this approach being ~ 1.5x faster, which adds when potentially creating thousands of events.
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const base = i * amountOfColumnsToInsert;

    params[base] = event.id;
    params[base + 1] = event.type;
    params[base + 2] = event.startsAt;
    params[base + 3] = event.duration;
    params[base + 4] = event.villageId ?? null;

    let metaObj: Record<string, SQLOutputValue> | undefined;
    for (const property in event) {
      if (requiredEventProperties.has(property)) {
        continue;
      }

      // Lazy object initialization
      if (!metaObj) {
        metaObj = {};
      }

      metaObj[property] = event[property as keyof GameEvent];
    }

    params[base + 5] = metaObj ? JSON.stringify(metaObj) : null;
  }

  const stmt = database.prepare(sql);
  stmt.bind(params).stepReset();
};

export const getEventCost = (event: GameEvent): number[] => {
  if (isBuildingLevelUpEvent(event)) {
    const { buildingId, level } = event;
    return calculateBuildingCostForLevel(buildingId, level);
  }

  if (isUnitResearchEvent(event)) {
    const { unitId } = event;
    return calculateUnitResearchCost(unitId);
  }

  if (isUnitImprovementEvent(event)) {
    const { unitId, level } = event;
    return calculateUnitUpgradeCostForLevel(unitId, level);
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

    const rows = database.selectObjects(selectAllRelevantEffectsByIdQuery, {
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

    const rows = database.selectObjects(selectAllRelevantEffectsByIdQuery, {
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

    const rows = database.selectObjects(selectAllRelevantEffectsByIdQuery, {
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

    const rows = database.selectObjects(selectAllRelevantEffectsByIdQuery, {
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
      return 5000 * total;
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
  database: DbFacade,
  event: GameEvent,
): number => {
  if (isTroopTrainingEvent(event)) {
    const { villageId, buildingId } = event;

    const rows = database.selectObjects(selectAllVillageEventsByTypeQuery, {
      $village_id: villageId,
      $type: 'troopTraining',
    });

    const events = eventsListSchema.parse(rows) as GameEvent<'troopTraining'>[];

    const relevantTrainingEvents = events.filter((event) => {
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

    const buildingEventRows = database.selectObjects(
      selectVillageBuildingEventsQuery,
      {
        $village_id: villageId,
      },
    );

    const buildingEvents = eventsListSchema.parse(
      buildingEventRows,
    ) as GameEvent<'buildingLevelChange'>[];

    if (tribe === 'romans') {
      const relevantEvents = buildingEvents.filter((event) => {
        if (buildingFieldId <= 18) {
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
