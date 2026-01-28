import type { SqlValue } from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import {
  calculateBuildingCostForLevel,
  calculateBuildingDurationForLevel,
} from '@pillage-first/game-assets/buildings/utils';
import {
  calculateUnitResearchCost,
  calculateUnitResearchDuration,
  calculateUnitUpgradeCostForLevel,
  calculateUnitUpgradeDurationForLevel,
  getUnitDefinition,
} from '@pillage-first/game-assets/units/utils';
import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { speedSchema } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { calculateComputedEffect } from '@pillage-first/utils/game/calculate-computed-effect';
import {
  isAdventurePointIncreaseEvent,
  isBuildingConstructionEvent,
  isBuildingDestructionEvent,
  isBuildingLevelUpEvent,
  isScheduledBuildingEvent,
  isTroopTrainingEvent,
  isUnitImprovementEvent,
  isUnitResearchEvent,
} from '@pillage-first/utils/guards/event';
import { selectAllRelevantEffectsByIdQuery } from '../../utils/queries/effect-queries';
import { selectAllVillageEventsByTypeQuery } from '../../utils/queries/event-queries';
import {
  calculateVillageResourcesAt,
  subtractVillageResourcesAt,
} from '../../utils/village';
import { apiEffectSchema } from '../../utils/zod/effect-schemas';
import { eventSchema } from '../../utils/zod/event-schemas';
import { calculateAdventurePointIncreaseEventDuration } from '../resolvers/utils/adventures';

// TODO: Implement this
export const notifyAboutEventCreationFailure = (events: GameEvent[]): void => {
  console.error('Following events failed to create', events);

  const [event] = events;

  globalThis.postMessage({
    eventKey: 'event:worker-event-creation-error',
    ...event,
  } satisfies EventApiNotificationEvent);
};

export const checkAndSubtractVillageResources = (
  database: DbFacade,
  events: GameEvent[],
): boolean => {
  const isDeveloperModeEnabled = database.selectValue({
    sql: 'SELECT is_developer_mode_enabled FROM preferences;',
    schema: z.number(),
  });

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

export const insertEvents = (database: DbFacade, events: GameEvent[]): void => {
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
    INSERT INTO
      events (id, type, starts_at, duration, village_id, meta)
    VALUES
      (?, ?, ?, ?, ?, ?)
  `;

  const amountOfEvents = events.length;

  const sql = `${sqlTemplate}${',(?, ?, ?, ?, ?, ?)'.repeat(amountOfEvents - 1)};`;

  const params: SqlValue[] = Array.from({
    length: events.length * amountOfColumnsToInsert,
  });

  // We intentionally skip object destructuring assignment in favor of this manual approach,
  // due to this approach being ~ 1.5x faster, which adds when potentially creating thousands of events.
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    const base = i * amountOfColumnsToInsert;

    params[base] = event.id;
    params[base + 1] = event.type;
    params[base + 2] = event.startsAt;
    params[base + 3] = event.duration;
    params[base + 4] = event.villageId ?? null;

    let metaObj: Record<string, SqlValue> | undefined;
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

  const stmt = database.prepare({ sql });
  stmt.bind(params).stepReset();
};

export const _validateEventCreation = (
  database: DbFacade,
  event: GameEvent,
): boolean => {
  if (isUnitImprovementEvent(event)) {
    const { villageId } = event;

    const hasOngoingUnitImprovementEventsInThisVillage = database.selectValue({
      sql: `
        SELECT
          EXISTS
          (
            SELECT 1
            FROM
              events
            WHERE
              type = 'unitImprovement'
              AND village_id = $villageId
            ) AS event_exists;
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    });

    if (hasOngoingUnitImprovementEventsInThisVillage) {
      return false;
    }
  }

  if (isUnitResearchEvent(event)) {
    const { unitId, villageId } = event;

    const hasOngoingUnitResearchEventsInThisVillage = !!database.selectValue({
      sql: `
        SELECT
          EXISTS
          (
            SELECT 1
            FROM
              events
            WHERE
              type = 'unitResearch'
              AND village_id = $villageId
            ) AS event_exists;
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    });

    if (hasOngoingUnitResearchEventsInThisVillage) {
      return false;
    }

    const hasAlreadyResearchedUnitsWithSameIdAndVillage =
      !!database.selectValue({
        sql: `
          SELECT
            EXISTS
            (
              SELECT 1
              FROM
                unit_research
              WHERE
                village_id = $villageId
                AND unit_id = $unitId
              ) AS is_researched;
        `,
        bind: {
          $villageId: villageId,
          $unitId: unitId,
        },
        schema: z.number(),
      });

    return !hasAlreadyResearchedUnitsWithSameIdAndVillage;
  }

  if (isTroopTrainingEvent(event)) {
    const { villageId, unitId, buildingId } = event;

    const isUnitResearched = !!database.selectValue({
      sql: `
        SELECT
          EXISTS
          (
            SELECT 1
            FROM
              unit_research
            WHERE
              village_id = $village_id
              AND unit_id = $unit_id
            ) AS is_researched;`,
      bind: {
        $village_id: villageId,
        $unit_id: unitId,
      },
      schema: z.number(),
    });

    if (!isUnitResearched) {
      return false;
    }

    const doesUnitTrainingBuildingExist = !!database.selectValue({
      sql: `
        SELECT
          EXISTS
          (
            SELECT 1
            FROM
              building_fields
            WHERE
              village_id = $village_id
              AND building_id = $building_id
              AND level > 0
            ) AS building_exists;
      `,
      bind: {
        $village_id: villageId,
        $building_id: buildingId,
      },
      schema: z.number(),
    });

    return doesUnitTrainingBuildingExist;
  }

  if (isBuildingLevelUpEvent(event)) {
  }

  if (isScheduledBuildingEvent(event)) {
  }

  return true;
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

const DEFAULT_DURATION = 0;
export const getEventDuration = (
  database: DbFacade,
  event: GameEvent,
): number => {
  const isDeveloperModeEnabled = database.selectValue({
    sql: 'SELECT is_developer_mode_enabled FROM preferences;',
    schema: z.number(),
  });

  let duration: number | null = null;

  if (
    isDeveloperModeEnabled ||
    isBuildingConstructionEvent(event) ||
    isBuildingDestructionEvent(event)
  ) {
    duration = DEFAULT_DURATION;
  } else if (isBuildingLevelUpEvent(event) || isScheduledBuildingEvent(event)) {
    const { villageId, buildingId, level } = event;

    const effects = database.selectObjects({
      sql: selectAllRelevantEffectsByIdQuery,
      bind: {
        $effect_id: 'buildingDuration',
        $village_id: villageId,
      },
      schema: apiEffectSchema,
    });

    const { total } = calculateComputedEffect(
      'buildingDuration',
      effects,
      villageId,
    );

    const baseBuildingDuration = calculateBuildingDurationForLevel(
      buildingId,
      level,
    );

    duration = baseBuildingDuration * total;
  } else if (isUnitResearchEvent(event)) {
    const { villageId, unitId } = event;

    const effects = database.selectObjects({
      sql: selectAllRelevantEffectsByIdQuery,
      bind: {
        $effect_id: 'buildingDuration',
        $village_id: villageId,
      },
      schema: apiEffectSchema,
    });

    const { total: unitResearchDurationModifier } = calculateComputedEffect(
      'unitResearchDuration',
      effects,
      villageId,
    );

    duration =
      unitResearchDurationModifier * calculateUnitResearchDuration(unitId);
  } else if (isUnitImprovementEvent(event)) {
    const { villageId, unitId, level } = event;

    const effects = database.selectObjects({
      sql: selectAllRelevantEffectsByIdQuery,
      bind: {
        $effect_id: 'unitImprovementDuration',
        $village_id: villageId,
      },
      schema: apiEffectSchema,
    });

    const { total: unitImprovementDurationModifier } = calculateComputedEffect(
      'unitImprovementDuration',
      effects,
      villageId,
    );

    duration =
      unitImprovementDurationModifier *
      calculateUnitUpgradeDurationForLevel(unitId, level);
  } else if (isTroopTrainingEvent(event)) {
    const { unitId, villageId, durationEffectId } = event;

    const effects = database.selectObjects({
      sql: selectAllRelevantEffectsByIdQuery,
      bind: {
        $effect_id: 'buildingDuration',
        $village_id: villageId,
      },
      schema: apiEffectSchema,
    });

    const { total } = calculateComputedEffect(
      durationEffectId,
      effects,
      villageId,
    );

    const { baseRecruitmentDuration } = getUnitDefinition(unitId);

    duration = total * baseRecruitmentDuration;
  } else if (isAdventurePointIncreaseEvent(event)) {
    const { created_at, speed } = database.selectObject({
      sql: 'SELECT created_at, speed FROM servers LIMIT 1;',
      schema: z.strictObject({
        created_at: z.number(),
        speed: speedSchema,
      }),
    })!;

    duration = calculateAdventurePointIncreaseEventDuration(created_at, speed);
  }

  if (duration === null) {
    console.error('Missing duration calculation for event', event);
    return DEFAULT_DURATION;
  }
  return Math.ceil(duration);
};

export const getEventStartTime = (
  database: DbFacade,
  event: GameEvent,
): number => {
  if (isTroopTrainingEvent(event)) {
    const { villageId, buildingId } = event;

    const events = database.selectObjects({
      sql: selectAllVillageEventsByTypeQuery,
      bind: {
        $village_id: villageId,
        $type: 'troopTraining',
      },
      schema: eventSchema,
    }) as GameEvent<'troopTraining'>[];

    const relevantTrainingEvents = events.filter((event) => {
      return event.buildingId === buildingId;
    });

    if (relevantTrainingEvents.length > 0) {
      const lastEvent = relevantTrainingEvents.at(-1)!;
      return lastEvent.startsAt + lastEvent.duration;
    }

    return Date.now();
  }

  if (isUnitImprovementEvent(event)) {
    const { unitId } = event;

    const now = Date.now();

    const lastResolvesAtForThisUnitId = database.selectValue({
      sql: `
        SELECT COALESCE(MAX(resolves_at), $now) AS last_resolves_at
        FROM
          events
        WHERE
          type = 'unitImprovement'
          AND JSON_EXTRACT(meta, '$.unitId') = $unit_id
      `,
      bind: {
        $unit_id: unitId,
        $now: now,
      },
      schema: z.number(),
    })!;

    return lastResolvesAtForThisUnitId;
  }

  if (isScheduledBuildingEvent(event)) {
    const { villageId, buildingFieldId } = event;

    const resolvesAt = database.selectValue({
      sql: `
        WITH
          player_tribe AS (
            SELECT p.tribe AS tribe
            FROM
              villages v
                JOIN players p ON p.id = v.player_id
            WHERE
              v.id = $village_id
            )
        SELECT
          COALESCE(
            (
              SELECT MAX(e.resolves_at)
              FROM
                events e,
                player_tribe pt
              WHERE
                e.type = 'buildingLevelChange'
                AND e.village_id = $village_id
                AND (
                  -- If player is not Romans, include all building events
                  pt.tribe <> 'romans'
                    -- If Romans, only include events from the same "half" (<=18 or >18)
                    OR (
                    (CAST(JSON_EXTRACT(e.meta, '$.buildingFieldId') AS INTEGER) <= 18 AND $building_field_id <= 18)
                      OR
                    (CAST(JSON_EXTRACT(e.meta, '$.buildingFieldId') AS INTEGER) > 18 AND $building_field_id > 18)
                    )
                  )
              ),
            $now
            ) AS resolves_at;
      `,
      bind: {
        $village_id: villageId,
        $building_field_id: buildingFieldId,
        $now: Date.now(),
      },
      schema: z.number(),
    })!;

    return resolvesAt;
  }

  if (isAdventurePointIncreaseEvent(event)) {
    const { startsAt, duration } = event;

    return startsAt + duration;
  }

  if (isBuildingConstructionEvent(event) || isBuildingLevelUpEvent(event)) {
    return Date.now();
  }

  return Date.now();
};
