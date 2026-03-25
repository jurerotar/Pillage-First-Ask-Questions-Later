import type { SqlValue } from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { calculateAdventurePointIncreaseEventDuration } from '@pillage-first/game-assets/utils/adventures';
import {
  calculateBuildingCostForLevel,
  calculateBuildingDurationForLevel,
  getBuildingDefinition,
} from '@pillage-first/game-assets/utils/buildings';
import {
  calculateHealthRegenerationEventDuration,
  calculateHeroLevel,
  calculateHeroRevivalCost,
  calculateHeroRevivalTime,
} from '@pillage-first/game-assets/utils/hero';
import { calculateLoyaltyIncreaseEventDuration } from '@pillage-first/game-assets/utils/loyalty';
import {
  calculateUnitResearchCost,
  calculateUnitResearchDuration,
  calculateUnitUpgradeCostForLevel,
  calculateUnitUpgradeDurationForLevel,
  getUnitDefinition,
} from '@pillage-first/game-assets/utils/units';
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
  isAttackTroopMovementEvent,
  isBuildingConstructionEvent,
  isBuildingDestructionEvent,
  isBuildingEvent,
  isBuildingLevelUpEvent,
  isFindNewVillageTroopMovementEvent,
  isHeroHealthRegenerationEvent,
  isHeroRevivalEvent,
  isLoyaltyIncreaseEvent,
  isOasisOccupationTroopMovementEvent,
  isRaidTroopMovementEvent,
  isReinforcementsTroopMovementEvent,
  isRelocationTroopMovementEvent,
  isReturnTroopMovementEvent,
  isScheduledBuildingEvent,
  isTroopMovementEvent,
  isTroopTrainingEvent,
  isUnitImprovementEvent,
  isUnitResearchEvent,
} from '@pillage-first/utils/guards/event';
import { selectAllRelevantEffectsByIdQuery } from '../../utils/queries/effect-queries';
import { selectAllVillageEventsByTypeQuery } from '../../utils/queries/event-queries';
import { calculateVillageResourcesAt } from '../../utils/village';
import { apiEffectSchema } from '../../utils/zod/effect-schemas';
import { eventSchema } from '../../utils/zod/event-schemas';
import { removeTroops } from '../resolvers/utils/troops';
import { calculateAdventureDuration } from './adventures';

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
      metaObj ??= {};

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
): void => {
  if (isUnitImprovementEvent(event)) {
    const { villageId, level } = event;

    if (level > 20) {
      throw new Error('Unit upgrade level cannot exceed 20');
    }

    const smithyLevel = database.selectValue({
      sql: `
        SELECT
          COALESCE(
            (
              SELECT
                bf.level
              FROM
                building_fields bf
                  JOIN building_ids bi ON bi.id = bf.building_id
              WHERE
                bf.village_id = $village_id
                AND bi.building = 'SMITHY'
              LIMIT 1
              ),
            0
          ) AS smithy_level;
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    })!;

    if (smithyLevel < level) {
      throw new Error('Smithy level is too low for this unit upgrade');
    }

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
      schema: z.coerce.boolean(),
    });

    if (hasOngoingUnitImprovementEventsInThisVillage) {
      throw new Error('Smithy is busy');
    }

    const currentUnitUpgradeLevel = database.selectValue({
      sql: `
        SELECT
          COALESCE(
            (
              SELECT
                level
              FROM
                unit_improvements
              WHERE
                player_id = (
                  SELECT
                    player_id
                  FROM
                    villages
                  WHERE
                    id = $village_id
                  )
                AND unit_id = (
                  SELECT
                    id
                  FROM
                    unit_ids
                  WHERE
                    unit = $unit_id
                  )
              ),
            0
          ) AS current_level;
      `,
      bind: {
        $village_id: villageId,
        $unit_id: event.unitId,
      },
      schema: z.number(),
    })!;

    if (currentUnitUpgradeLevel >= level) {
      throw new Error('Unit upgrade level already exists');
    }
  }

  if (isUnitResearchEvent(event)) {
    const { unitId, villageId } = event;

    const hasOngoingUnitResearchEventsInThisVillage = database.selectValue({
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
      schema: z.coerce.boolean(),
    });

    if (hasOngoingUnitResearchEventsInThisVillage) {
      throw new Error('Academy is busy');
    }

    const hasAlreadyResearchedUnitsWithSameIdAndVillage = database.selectValue({
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
      schema: z.coerce.boolean(),
    });

    if (hasAlreadyResearchedUnitsWithSameIdAndVillage) {
      throw new Error('Unit is already researched');
    }
  }

  if (isTroopTrainingEvent(event)) {
    const { villageId, unitId, buildingId } = event;

    const isUnitResearched = database.selectValue({
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
      schema: z.coerce.boolean(),
    });

    if (!isUnitResearched) {
      throw new Error('Unit is not researched');
    }

    const doesUnitTrainingBuildingExist = database.selectValue({
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
      schema: z.coerce.boolean(),
    });

    if (!doesUnitTrainingBuildingExist) {
      throw new Error('Unit training building does not exist');
    }
  }

  if (isBuildingLevelUpEvent(event)) {
    const { buildingId, level } = event;
    const { maxLevel } = getBuildingDefinition(buildingId);

    if (level > maxLevel) {
      throw new Error('Building level cannot exceed max level');
    }
  }

  if (isBuildingEvent(event)) {
    const { villageId, buildingFieldId } = event;

    const { buildingEventsCount } = database.selectObject({
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
          pt.tribe,
          (
            SELECT COUNT(*)
            FROM
              events e
            WHERE
              e.type IN ('buildingConstruction', 'buildingLevelChange')
              AND e.village_id = $village_id
              AND (
                -- If player is not Romans, include all building events
                pt.tribe <> 'romans'
                  -- If Romans, only include events from the same "half" (<=18 or >18)
                  OR (
                  (CAST(JSON_EXTRACT(e.meta, '$.buildingFieldId') AS INTEGER) <= 18 AND
                   CAST($building_field_id AS INTEGER) <= 18)
                    OR
                  (CAST(JSON_EXTRACT(e.meta, '$.buildingFieldId') AS INTEGER) > 18 AND
                   CAST($building_field_id AS INTEGER) > 18)
                  )
                )
            ) AS buildingEventsCount
        FROM
          player_tribe pt;
      `,
      bind: {
        $village_id: villageId,
        $building_field_id: buildingFieldId,
      },
      schema: z.strictObject({
        tribe: playableTribeSchema,
        buildingEventsCount: z.number(),
      }),
    })!;

    if (buildingEventsCount >= 1) {
      throw new Error('Building construction queue is full');
    }
  }

  if (isBuildingDestructionEvent(event)) {
    const { villageId } = event;

    const hasOngoingBuildingDestructionEventInThisVillage =
      database.selectValue({
        sql: `
          SELECT
            EXISTS
            (
              SELECT 1
              FROM
                events
              WHERE
                type = 'buildingDestruction'
                AND village_id = $village_id
              ) AS event_exists;
        `,
        bind: {
          $village_id: villageId,
        },
        schema: z.coerce.boolean(),
      });

    if (hasOngoingBuildingDestructionEventInThisVillage) {
      throw new Error('Main building is busy');
    }
  }

  if (isBuildingConstructionEvent(event)) {
    const { villageId, buildingFieldId } = event;

    const isBuildingFieldOccupied = database.selectValue({
      sql: `
        SELECT
          EXISTS
          (
            SELECT 1
            FROM
              building_fields
            WHERE
              village_id = $village_id
              AND field_id = $building_field_id
              AND level > 0
            ) AS is_occupied;
      `,
      bind: {
        $village_id: villageId,
        $building_field_id: buildingFieldId,
      },
      schema: z.coerce.boolean(),
    });

    if (isBuildingFieldOccupied) {
      throw new Error('Building field is already occupied');
    }
  }

  if (isScheduledBuildingEvent(event)) {
  }

  if (isHeroRevivalEvent(event)) {
    const isHeroAlive = database.selectValue({
      sql: 'SELECT health > 0 FROM heroes WHERE player_id = $player_id;',
      bind: { $player_id: PLAYER_ID },
      schema: z.coerce.boolean(),
    });

    if (isHeroAlive) {
      throw new Error('Hero is already alive');
    }
  }

  if (isTroopMovementEvent(event)) {
    if (isAdventureTroopMovementEvent(event)) {
      const hasAvailableAdventurePoints = database.selectValue({
        sql: `
          SELECT
            COALESCE(ha.available, 0) > 0 AS has_available_adventure_points
          FROM
            heroes h
              LEFT JOIN hero_adventures ha ON ha.hero_id = h.id
          WHERE
            h.player_id = $player_id;
        `,
        bind: { $player_id: PLAYER_ID },
        schema: z.coerce.boolean(),
      });

      if (!hasAvailableAdventurePoints) {
        throw new Error('No adventure points available');
      }
    }

    if (isAttackTroopMovementEvent(event) || isRaidTroopMovementEvent(event)) {
      const {
        coordinates: { x, y },
      } = event;

      const isVillageOrOasis = database.selectValue({
        sql: `
          SELECT
            EXISTS
            (
              SELECT 1
              FROM
                tiles t
                  LEFT JOIN villages v ON v.tile_id = t.id
                  LEFT JOIN oasis o ON o.tile_id = t.id
              WHERE
                t.x = $x
                AND t.y = $y
                AND (v.id IS NOT NULL OR o.id IS NOT NULL)
              ) AS is_village_or_oasis;
        `,
        bind: { $x: x, $y: y },
        schema: z.coerce.boolean(),
      });

      if (!isVillageOrOasis) {
        throw new Error('Target must be a village or an oasis');
      }
    }

    if (isFindNewVillageTroopMovementEvent(event)) {
      const {
        coordinates: { x, y },
      } = event;

      const isUnoccupied = database.selectValue({
        sql: `
          SELECT
            EXISTS
            (
              SELECT 1
              FROM
                tiles t
                  LEFT JOIN villages v ON v.tile_id = t.id
                  LEFT JOIN oasis o ON o.tile_id = t.id
              WHERE
                t.x = $x
                AND t.y = $y
                AND v.id IS NULL
                AND o.id IS NULL
              ) AS is_unoccupied;
        `,
        bind: { $x: x, $y: y },
        schema: z.coerce.boolean(),
      });

      if (!isUnoccupied) {
        throw new Error('Target tile must be unoccupied');
      }
    }

    if (isOasisOccupationTroopMovementEvent(event)) {
      const {
        coordinates: { x, y },
        villageId,
      } = event;

      const oasisStatus = database.selectObject({
        sql: `
          SELECT
            o.id IS NOT NULL AS is_oasis,
            o.village_id = $village_id AS is_occupied_by_you
          FROM
            tiles t
              LEFT JOIN oasis o ON o.tile_id = t.id
          WHERE
            t.x = $x
            AND t.y = $y;
        `,
        bind: { $x: x, $y: y, $village_id: villageId },
        schema: z.object({
          is_oasis: z.coerce.boolean(),
          is_occupied_by_you: z.coerce.boolean(),
        }),
      });

      if (!oasisStatus?.is_oasis) {
        throw new Error('Target must be an oasis');
      }

      if (oasisStatus.is_occupied_by_you) {
        throw new Error('Oasis is already occupied by you');
      }

      const { occupiedOases, occupiedOasisSlots } = database.selectObject({
        sql: `
          SELECT
            (
              SELECT COUNT(*)
              FROM
                oasis
              WHERE
                village_id = $village_id
              ) AS occupiedOases,
            (
              SELECT
                CASE
                  WHEN bf.level >= 20 THEN 3
                  WHEN bf.level >= 15 THEN 2
                  WHEN bf.level >= 10 THEN 1
                  ELSE 0
                  END
              FROM
                building_fields bf
                  JOIN building_ids bi ON bi.id = bf.building_id
              WHERE
                bf.village_id = $village_id
                AND bi.building = 'HEROS_MANSION'
              LIMIT 1
              ) AS occupiedOasisSlots;
        `,
        bind: {
          $village_id: villageId,
        },
        schema: z.strictObject({
          occupiedOases: z.number(),
          occupiedOasisSlots: z.number().nullable(),
        }),
      })!;

      if (occupiedOases >= (occupiedOasisSlots ?? 0)) {
        throw new Error('No free oasis occupation slots available');
      }
    }

    if (
      isReinforcementsTroopMovementEvent(event) ||
      isRelocationTroopMovementEvent(event)
    ) {
      const {
        coordinates: { x, y },
      } = event;

      const isPlayerVillage = database.selectValue({
        sql: `
          SELECT
            EXISTS
            (
              SELECT 1
              FROM
                tiles t
                  JOIN villages v ON v.tile_id = t.id
              WHERE
                t.x = $x
                AND t.y = $y
                AND v.player_id = $player_id
              ) AS is_player_village;
        `,
        bind: { $x: x, $y: y, $player_id: PLAYER_ID },
        schema: z.coerce.boolean(),
      });

      if (!isPlayerVillage) {
        throw new Error(
          'Reinforcements and relocations can only be sent to your own villages',
        );
      }
    }
  }
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
      schema: z.coerce.boolean(),
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
      schema: z.coerce.boolean(),
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
      schema: z.coerce.boolean(),
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
      schema: z.coerce.boolean(),
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
      schema: z.coerce.boolean(),
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
      schema: z.coerce.boolean(),
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
      schema: z.coerce.boolean(),
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
      schema: z.coerce.boolean(),
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
      schema: z.coerce.boolean(),
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

  if (isTroopMovementEvent(event)) {
    const isInstantUnitTravelEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_travel_enabled FROM developer_settings',
      schema: z.coerce.boolean(),
    })!;

    if (isInstantUnitTravelEnabled) {
      return 0;
    }

    if (isAdventureTroopMovementEvent(event)) {
      return calculateAdventureDuration(database, false);
    }

    // This case has to be handled differently, because hero adventure return duration is not affected by any bonuses
    if (
      isReturnTroopMovementEvent(event) &&
      event.originalMovementType === 'adventure'
    ) {
      return calculateAdventureDuration(database, true);
    }

    // For now, return the duration from the event itself to avoid the error,
    // until a proper distance-based calculation is implemented.
    return 10_000;
  }

  if (isHeroRevivalEvent(event)) {
    const isInstantHeroReviveEnabled = database.selectValue({
      sql: 'SELECT is_instant_hero_revive_enabled FROM developer_settings',
      schema: z.coerce.boolean(),
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

  if (isHeroHealthRegenerationEvent(event)) {
    const { healthRegeneration, speed } = database.selectObject({
      sql: 'SELECT health_regeneration AS healthRegeneration, servers.speed FROM heroes JOIN servers ON 1 = 1 WHERE player_id = $player_id;',
      bind: { $player_id: PLAYER_ID },
      schema: z.object({
        healthRegeneration: z.number(),
        speed: speedSchema,
      }),
    })!;

    return calculateHealthRegenerationEventDuration(healthRegeneration, speed);
  }
  if (isLoyaltyIncreaseEvent(event)) {
    const speed = database.selectValue({
      sql: 'SELECT speed FROM servers',
      schema: speedSchema,
    })!;

    return calculateLoyaltyIncreaseEventDuration(speed);
  }

  throw new Error(
    `Missing duration calculation for event type "${event.type}"`,
  );
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

  if (isHeroHealthRegenerationEvent(event)) {
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
