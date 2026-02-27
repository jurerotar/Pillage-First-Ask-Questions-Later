import type { SqlValue } from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import {
  calculateBuildingCostForLevel,
  calculateBuildingDurationForLevel,
} from '@pillage-first/game-assets/buildings/utils';
import {
  calculateHeroLevel,
  calculateHeroRevivalCost,
  calculateHeroRevivalTime,
} from '@pillage-first/game-assets/hero/utils';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  calculateUnitResearchCost,
  calculateUnitResearchDuration,
  calculateUnitUpgradeCostForLevel,
  calculateUnitUpgradeDurationForLevel,
  getUnitDefinition,
} from '@pillage-first/game-assets/units/utils';
import type { ControllerErrorEvent } from '@pillage-first/types/api-events';
import type {
  GameEvent,
  TroopMovementEvent,
} from '@pillage-first/types/models/game-event';
import { speedSchema } from '@pillage-first/types/models/server';
import { playableTribeSchema } from '@pillage-first/types/models/tribe';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { calculateComputedEffect } from '@pillage-first/utils/game/calculate-computed-effect';
import {
  isAdventurePointIncreaseEvent,
  isAdventureTroopMovementEvent,
  isBuildingConstructionEvent,
  isBuildingDestructionEvent,
  isBuildingLevelUpEvent,
  isFindNewVillageTroopMovementEvent,
  isHeroRevivalEvent,
  isOasisOccupationTroopMovementEvent,
  isReturnTroopMovementEvent,
  isScheduledBuildingEvent,
  isTroopMovementEvent,
  isTroopTrainingEvent,
  isUnitImprovementEvent,
  isUnitResearchEvent,
} from '@pillage-first/utils/guards/event';
import { selectAllRelevantEffectsByIdQuery } from '../../utils/queries/effect-queries';
import { selectAllVillageEventsByTypeQuery } from '../../utils/queries/event-queries';
import { removeTroops } from '../../utils/queries/troop-queries';
import { calculateVillageResourcesAt } from '../../utils/village';
import { apiEffectSchema } from '../../utils/zod/effect-schemas';
import { eventSchema } from '../../utils/zod/event-schemas';
import { calculateAdventurePointIncreaseEventDuration } from '../resolvers/utils/adventures';
import { calculateAdventureDuration } from './adventures.ts';

// TODO: Implement this
export const notifyAboutEventCreationFailure = (reason: string): void => {
  globalThis.postMessage({
    eventKey: 'event:controller-error',
    error: new Error(`Failed to create an event with reason: ${reason}`),
    reason,
  } satisfies ControllerErrorEvent);
};

export const insertEvents = (database: DbFacade, events: GameEvent[]): void => {
  const requiredEventProperties = new Set([
    'type',
    'startsAt',
    'duration',
    'villageId',
  ]);
  // We add + 1 for the `meta` column
  const amountOfColumnsToInsert = requiredEventProperties.size + 1;

  const sqlTemplate = `
    INSERT INTO
      events (type, starts_at, duration, village_id, meta)
    VALUES
      (?, ?, ?, ?, ?)
  `;

  const amountOfEvents = events.length;

  const sql = `${sqlTemplate}${',(?, ?, ?, ?, ?)'.repeat(amountOfEvents - 1)};`;

  const params: SqlValue[] = Array.from({
    length: events.length * amountOfColumnsToInsert,
  });

  // We intentionally skip object destructuring assignment in favor of this manual approach,
  // due to this approach being ~ 1.5x faster, which adds when potentially creating thousands of events.
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    const base = i * amountOfColumnsToInsert;

    params[base] = event.type;
    params[base + 1] = event.startsAt;
    params[base + 2] = event.duration;
    params[base + 3] = event.villageId ?? null;

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

    params[base + 4] = metaObj ? JSON.stringify(metaObj) : null;
  }

  const stmt = database.prepare({ sql });
  stmt.bind(params).stepReset();
};

// WARNING: `event` does not include `startsAt` and `duration` at this point in the flow!
export const validateEventCreationPrerequisites = (
  database: DbFacade,
  event: GameEvent,
): [true, null] | [false, string] => {
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
              AND village_id = $village_id
            ) AS event_exists;
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    });

    if (hasOngoingUnitImprovementEventsInThisVillage) {
      return [false, 'Smithy is busy'];
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
              AND village_id = $village_id
            ) AS event_exists;
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    });

    if (hasOngoingUnitResearchEventsInThisVillage) {
      return [false, 'Academy is busy'];
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
                village_id = $village_id
                AND unit_id = (
                  SELECT id
                  FROM
                    unit_ids
                  WHERE
                    unit = $unit_id
                  )
              ) AS is_researched;
        `,
        bind: {
          $village_id: villageId,
          $unit_id: unitId,
        },
        schema: z.number(),
      });

    if (hasAlreadyResearchedUnitsWithSameIdAndVillage) {
      return [false, 'Unit is already researched'];
    }
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
              AND unit_id = (
                SELECT id
                FROM
                  unit_ids
                WHERE
                  unit = $unit_id
                )
            ) AS is_researched;`,
      bind: {
        $village_id: villageId,
        $unit_id: unitId,
      },
      schema: z.number(),
    });

    if (!isUnitResearched) {
      return [false, 'Unit is not researched'];
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
              AND building_id = (
                SELECT id
                FROM
                  building_ids
                WHERE
                  building = $building_id
                )
              AND level > 0
            ) AS building_exists;
      `,
      bind: {
        $village_id: villageId,
        $building_id: buildingId,
      },
      schema: z.number(),
    });

    if (!doesUnitTrainingBuildingExist) {
      return [false, 'Unit training building does not exist'];
    }
  }

  if (isBuildingLevelUpEvent(event)) {
  }

  if (isScheduledBuildingEvent(event)) {
  }

  if (isHeroRevivalEvent(event)) {
    const isHeroAlive = !!database.selectValue({
      sql: 'SELECT health > 0 FROM heroes WHERE player_id = $player_id;',
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    });

    if (isHeroAlive) {
      return [false, 'Hero is already alive'];
    }
  }

  return [true, null];
};

// WARNING: `event` does not include `startsAt` and `duration` at this point in the flow!
export const validateEventCreationResources = (
  database: DbFacade,
  event: GameEvent,
  eventCost: number[],
): boolean => {
  const { villageId, startsAt } = event;
  const [woodCost, clayCost, ironCost, wheatCost] = eventCost;
  const { currentWood, currentClay, currentIron, currentWheat } =
    calculateVillageResourcesAt(database, villageId, startsAt);

  return !(
    woodCost > currentWood ||
    clayCost > currentClay ||
    ironCost > currentIron ||
    wheatCost > currentWheat
  );
};

export const runEventCreationSideEffects = (
  database: DbFacade,
  events: GameEvent[],
) => {
  const [event] = events;

  if (isTroopMovementEvent(event)) {
    const troopMovementEvents = events as TroopMovementEvent[];

    for (const { troops } of troopMovementEvents) {
      removeTroops(database, troops);
    }
  }
};

// WARNING: `event` does not include `startsAt` and `duration` at this point in the flow!
export const getEventCost = (
  database: DbFacade,
  event: GameEvent,
): number[] => {
  if (isBuildingLevelUpEvent(event)) {
    const isFreeBuildingConstructionEnabled = database.selectValue({
      sql: 'SELECT is_free_building_construction_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isFreeBuildingConstructionEnabled) {
      return [0, 0, 0, 0];
    }

    const { buildingId, level } = event;
    return calculateBuildingCostForLevel(buildingId, level);
  }

  if (isUnitResearchEvent(event)) {
    const isFreeUnitResearchEnabled = database.selectValue({
      sql: 'SELECT is_free_unit_research_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isFreeUnitResearchEnabled) {
      return [0, 0, 0, 0];
    }

    const { unitId } = event;
    return calculateUnitResearchCost(unitId);
  }

  if (isUnitImprovementEvent(event)) {
    const isFreeUnitImprovementEnabled = database.selectValue({
      sql: 'SELECT is_free_unit_improvement_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isFreeUnitImprovementEnabled) {
      return [0, 0, 0, 0];
    }

    const { unitId, level } = event;
    return calculateUnitUpgradeCostForLevel(unitId, level);
  }

  if (isTroopTrainingEvent(event)) {
    const isFreeUnitTrainingEnabled = database.selectValue({
      sql: 'SELECT is_free_unit_training_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isFreeUnitTrainingEnabled) {
      return [0, 0, 0, 0];
    }

    const { unitId, buildingId, amount } = event;
    const { baseRecruitmentCost } = getUnitDefinition(unitId);

    const costModifier =
      buildingId === 'GREAT_BARRACKS' || buildingId === 'GREAT_STABLE' ? 3 : 1;

    return baseRecruitmentCost.map((cost) => cost * costModifier * amount);
  }

  if (isHeroRevivalEvent(event)) {
    const isFreeHeroReviveEnabled = database.selectValue({
      sql: 'SELECT is_free_hero_revive_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isFreeHeroReviveEnabled) {
      return [0, 0, 0, 0];
    }

    const { experience, tribe } = database.selectObject({
      sql: `
        SELECT h.experience, ti.tribe
        FROM
          heroes h
            JOIN players p ON h.player_id = p.id
            JOIN tribe_ids ti ON p.tribe_id = ti.id
        WHERE
          h.player_id = $player_id;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.strictObject({
        experience: z.number(),
        tribe: playableTribeSchema,
      }),
    })!;

    const { level } = calculateHeroLevel(experience);

    return calculateHeroRevivalCost(tribe, level);
  }

  return [0, 0, 0, 0];
};

// WARNING: `event` does not include `startsAt` and `duration` at this point in the flow!
export const getEventDuration = (
  database: DbFacade,
  event: GameEvent,
): number => {
  if (isBuildingConstructionEvent(event) || isBuildingDestructionEvent(event)) {
    return 0;
  }
  if (isBuildingLevelUpEvent(event) || isScheduledBuildingEvent(event)) {
    const isInstantBuildingConstructionEnabled = database.selectValue({
      sql: 'SELECT is_instant_building_construction_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isInstantBuildingConstructionEnabled) {
      return 0;
    }

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

    return baseBuildingDuration * total;
  }
  if (isUnitResearchEvent(event)) {
    const isInstantUnitResearchEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_research_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isInstantUnitResearchEnabled) {
      return 0;
    }

    const { villageId, unitId } = event;

    const effects = database.selectObjects({
      sql: selectAllRelevantEffectsByIdQuery,
      bind: {
        $effect_id: 'unitResearchDuration',
        $village_id: villageId,
      },
      schema: apiEffectSchema,
    });

    const { total: unitResearchDurationModifier } = calculateComputedEffect(
      'unitResearchDuration',
      effects,
      villageId,
    );

    return unitResearchDurationModifier * calculateUnitResearchDuration(unitId);
  }
  if (isUnitImprovementEvent(event)) {
    const isInstantUnitImprovementEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_improvement_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isInstantUnitImprovementEnabled) {
      return 0;
    }

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

    return (
      unitImprovementDurationModifier *
      calculateUnitUpgradeDurationForLevel(unitId, level)
    );
  }
  if (isTroopTrainingEvent(event)) {
    const isInstantUnitTrainingEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_training_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isInstantUnitTrainingEnabled) {
      return 0;
    }

    const { unitId, villageId, durationEffectId } = event;

    const effects = database.selectObjects({
      sql: selectAllRelevantEffectsByIdQuery,
      bind: {
        $effect_id: durationEffectId,
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

    return total * baseRecruitmentDuration;
  }
  if (isAdventurePointIncreaseEvent(event)) {
    const { created_at, speed } = database.selectObject({
      sql: 'SELECT created_at, speed FROM servers LIMIT 1;',
      schema: z.strictObject({
        created_at: z.number(),
        speed: speedSchema,
      }),
    })!;

    return calculateAdventurePointIncreaseEventDuration(created_at, speed);
  }

  if (isAdventureTroopMovementEvent(event)) {
    const isInstantUnitTravelEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_travel_enabled FROM developer_settings',
      schema: z.number(),
    })!;

    if (isInstantUnitTravelEnabled) {
      return 0;
    }

    return calculateAdventureDuration(database, false);
  }

  if (isReturnTroopMovementEvent(event)) {
    const isInstantUnitTravelEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_travel_enabled FROM developer_settings',
      schema: z.number(),
    })!;

    if (isInstantUnitTravelEnabled) {
      return 0;
    }

    const { originalMovementType } = event;

    if (originalMovementType === 'adventure') {
      return calculateAdventureDuration(database, true);
    }

    // TODO: Add calculation for troop return
  }

  if (isHeroRevivalEvent(event)) {
    const isInstantHeroReviveEnabled = database.selectValue({
      sql: 'SELECT is_instant_hero_revive_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isInstantHeroReviveEnabled) {
      return 0;
    }

    const { experience, speed } = database.selectObject({
      sql: `
        SELECT h.experience, s.speed
        FROM
          heroes h
            JOIN servers s ON 1 = 1
        WHERE
          h.player_id = $player_id;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.strictObject({
        experience: z.number(),
        speed: speedSchema,
      }),
    })!;
    const { level } = calculateHeroLevel(experience);

    return calculateHeroRevivalTime(level) / speed;
  }

  console.error('Missing duration calculation for event', event);
  return 0;
};

// WARNING: `event` does not include `startsAt` and `duration` at this point in the flow!
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
            SELECT ti.tribe AS tribe
            FROM
              villages v
                JOIN players p ON p.id = v.player_id
                JOIN tribe_ids ti ON p.tribe_id = ti.id
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

  if (isAdventureTroopMovementEvent(event)) {
    return Date.now();
  }
  if (isFindNewVillageTroopMovementEvent(event)) {
    return Date.now();
  }
  if (isOasisOccupationTroopMovementEvent(event)) {
    return Date.now();
  }
  if (isReturnTroopMovementEvent(event)) {
    const { startsAt, duration } = event;

    return startsAt + duration;
  }

  return Date.now();
};
