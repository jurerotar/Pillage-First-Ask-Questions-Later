import type { SqlValue } from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  calculateBuildingCostForLevel,
  calculateBuildingDestructionDuration,
  calculateBuildingDurationForLevel,
  calculatePopulationDifference,
  getBuildingDefinition,
} from '@pillage-first/game-assets/utils/buildings';
import {
  calculateGatherersHutGatheringDuration,
  calculateGatherersHutPartySize,
} from '@pillage-first/game-assets/utils/gatherers-hut';
import {
  calculateHealthRegenerationEventDuration,
  calculateHeroLevel,
  calculateHeroRevivalCost,
  calculateHeroRevivalTime,
} from '@pillage-first/game-assets/utils/hero';
import {
  ANIMAL_CAGE_BASE_DURATION,
  ANIMAL_CAGE_COST,
  calculateHuntersLodgeHuntCost,
  calculateHuntersLodgeHuntDuration,
} from '@pillage-first/game-assets/utils/hunters-lodge';
import { calculateLoyaltyIncreaseEventDuration } from '@pillage-first/game-assets/utils/loyalty';
import {
  calculateTrapperCapacity,
  TRAPPER_CAGE_BASE_DURATION,
  TRAPPER_CAGE_COST,
} from '@pillage-first/game-assets/utils/trapper';
import {
  calculateUnitResearchCost,
  calculateUnitResearchDuration,
  calculateUnitUpgradeCostForLevel,
  calculateUnitUpgradeDurationForLevel,
  getUnitDefinition,
} from '@pillage-first/game-assets/utils/units';
import { effectSchema } from '@pillage-first/types/models/effect';
import type {
  GameEvent,
  TroopMovementEvent,
} from '@pillage-first/types/models/game-event';
import { speedSchema } from '@pillage-first/types/models/server';
import {
  playableTribeSchema,
  tribeSchema,
} from '@pillage-first/types/models/tribe';
import { BuildingConstructionQueueFullError } from '@pillage-first/utils/errors';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { calculateComputedEffect } from '@pillage-first/utils/game/calculate-computed-effect';
import { calculateTravelDuration } from '@pillage-first/utils/game/troop-movement-duration';
import {
  isAsclepeion,
  isHealingTroopTrainingBuilding,
  isHospital,
} from '@pillage-first/utils/guards/building';
import {
  isAdventureTroopMovementEvent,
  isAnimalCageProductionEvent,
  isBuildingConstructionEvent,
  isBuildingDestructionEvent,
  isBuildingDowngradeEvent,
  isBuildingEvent,
  isBuildingLevelChangeEvent,
  isGatherersHutGatheringTripEvent,
  isHeroHealthRegenerationEvent,
  isHeroRevivalEvent,
  isHuntersLodgeHuntEvent,
  isLoyaltyIncreaseEvent,
  isManuallyTriggeredReturnTroopMovementEvent,
  isResourceTransferEvent,
  isReturnTroopMovementEvent,
  isTradeRouteEvent,
  isTrapperCageProductionEvent,
  isTroopMovementEvent,
  isTroopTrainingEvent,
  isUnitImprovementEvent,
  isUnitResearchEvent,
} from '@pillage-first/utils/guards/event';
import {
  selectAllRelevantEffectsByIdQuery,
  selectUnitSpeedRelevantEffectsQuery,
} from '../queries/effect-queries';
import {
  selectAllVillageEventsByTypeQuery,
  selectVillageEventExistsByTypeQuery,
} from '../queries/event-queries';
import { selectServerMapSizeQuery } from '../queries/server-queries';
import { selectIsUnitResearchedQuery } from '../queries/unit-research-queries';
import {
  selectTribeByVillageId,
  selectVillageBuildingLevelQuery,
  selectVillageTileIdQuery,
} from '../queries/village-queries';
import {
  calculateAdventureDuration,
  getPlayerHeroAdventureStateAt,
  materializeHeroAdventurePointsAt,
} from './adventures';
import { assertBuildingConstructionRequirementsAreMet } from './building-requirements';
import {
  getFreeMerchantAmount,
  getMarketplaceVillage,
  getMerchantAmount,
  getMerchantMovementDuration,
  getTotalResourceAmount,
  getVillageMerchantStats,
} from './marketplace';
import {
  assessQueuedTroopCountByIdQuestCompletion,
  assessQueuedTroopCountQuestCompletion,
} from './quests';
import {
  materializeWoundedTroopsAt,
  removeTroops,
  removeWoundedTroops,
  selectWoundedTroopAmount,
  validateTroopMovement,
} from './troops';
import {
  areVillageBuildingRequirementsMet,
  doesTroopTrainingBuildingMatchUnit,
  doesTroopTrainingDurationEffectMatchBuilding,
  isUnitInVillageTribe,
} from './unit-event-validation';
import { calculateVillageResourcesAt } from './village';
import { apiEffectSchema } from './zod/effect-schemas';
import {
  baseEventRowSchema,
  mapEventRowToTypedEvent,
} from './zod/event-schemas';

const nonMetaEventProperties = new Set([
  'id',
  'type',
  'startsAt',
  'duration',
  'resolvesAt',
  'villageId',
]);

export const insertEvents = (database: DbFacade, events: GameEvent[]): void => {
  const amountOfColumnsToInsert = 5;

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
      if (nonMetaEventProperties.has(property)) {
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

    const smithyLevel =
      database.selectValue({
        sql: selectVillageBuildingLevelQuery,
        bind: {
          $village_id: villageId,
          $building_id: 'SMITHY',
        },
        schema: z.number().nullable(),
      }) ?? 0;

    if (smithyLevel < level) {
      throw new Error('Smithy level is too low for this unit upgrade');
    }

    const hasOngoingUnitImprovementEventsInThisVillage = database.selectValue({
      sql: selectVillageEventExistsByTypeQuery,
      bind: {
        $village_id: villageId,
        $type: 'unitImprovement',
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

    return;
  }

  if (isUnitResearchEvent(event)) {
    const { unitId, villageId } = event;
    const unit = getUnitDefinition(unitId);

    if (!isUnitInVillageTribe(database, villageId, unit)) {
      throw new Error('Unit does not belong to village tribe');
    }

    const hasOngoingUnitResearchEventsInThisVillage = database.selectValue({
      sql: selectVillageEventExistsByTypeQuery,
      bind: {
        $village_id: villageId,
        $type: 'unitResearch',
      },
      schema: z.coerce.boolean(),
    });

    if (hasOngoingUnitResearchEventsInThisVillage) {
      throw new Error('Academy is busy');
    }

    const hasAlreadyResearchedUnitsWithSameIdAndVillage = database.selectValue({
      sql: selectIsUnitResearchedQuery,
      bind: {
        $village_id: villageId,
        $unit_id: unitId,
      },
      schema: z.coerce.boolean(),
    });

    if (hasAlreadyResearchedUnitsWithSameIdAndVillage) {
      throw new Error('Unit is already researched');
    }

    if (
      !areVillageBuildingRequirementsMet(
        database,
        villageId,
        unit.researchRequirements,
      )
    ) {
      throw new Error('Unit research requirements are not met');
    }

    return;
  }

  if (isTroopTrainingEvent(event)) {
    const { villageId, unitId, buildingId, amount } = event;

    const unit = getUnitDefinition(unitId);
    const isHealing = isHealingTroopTrainingBuilding(buildingId);
    if (!isUnitInVillageTribe(database, villageId, unit)) {
      throw new Error('Unit does not belong to village tribe');
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error('Unit training amount must be positive');
    }

    if (unit.researchRequirements.length > 0) {
      const isUnitResearched = database.selectValue({
        sql: selectIsUnitResearchedQuery,
        bind: {
          $village_id: villageId,
          $unit_id: unitId,
        },
        schema: z.coerce.boolean(),
      });

      if (!isUnitResearched) {
        throw new Error('Unit is not researched');
      }
    }

    const unitTrainingBuildingLevel = database.selectValue({
      sql: selectVillageBuildingLevelQuery,
      bind: {
        $village_id: villageId,
        $building_id: buildingId,
      },
      schema: z.number().nullable(),
    });

    if (unitTrainingBuildingLevel === null) {
      throw new Error('Unit training building does not exist');
    }

    if (!doesTroopTrainingDurationEffectMatchBuilding(event)) {
      throw new Error('Unit training duration effect does not match building');
    }

    if (isHealing) {
      const tribe = database.selectValue({
        sql: selectTribeByVillageId,
        bind: {
          $village_id: villageId,
        },
        schema: tribeSchema,
      })!;

      if (isAsclepeion(buildingId) && tribe !== 'spartans') {
        throw new Error('Asclepeion can only be used by Spartans');
      }

      if (isHospital(buildingId) && tribe === 'spartans') {
        throw new Error('Spartans must use the Asclepeion');
      }

      if (unit.category !== 'infantry' && unit.category !== 'cavalry') {
        throw new Error('Only infantry and cavalry can be healed');
      }

      materializeWoundedTroopsAt(database, villageId, Date.now());

      const woundedAmount = selectWoundedTroopAmount(
        database,
        villageId,
        unitId,
      );

      if (amount > woundedAmount) {
        throw new Error('Not enough wounded troops available');
      }
    } else {
      if (!doesTroopTrainingBuildingMatchUnit(unit, buildingId)) {
        throw new Error('Unit training building does not match unit category');
      }

      if (
        !areVillageBuildingRequirementsMet(
          database,
          villageId,
          unit.recruitmentRequirements,
        )
      ) {
        throw new Error('Unit recruitment requirements are not met');
      }
    }

    return;
  }

  if (isAnimalCageProductionEvent(event) || isHuntersLodgeHuntEvent(event)) {
    const { villageId } = event;

    const huntersLodgeLevel = database.selectValue({
      sql: selectVillageBuildingLevelQuery,
      bind: {
        $village_id: villageId,
        $building_id: 'HUNTERS_LODGE',
      },
      schema: z.number().nullable(),
    });

    if (huntersLodgeLevel == null) {
      throw new Error("Hunter's Lodge does not exist");
    }

    if (isAnimalCageProductionEvent(event) && event.cageAmount <= 0) {
      throw new Error('Animal cage amount must be positive');
    }

    if (isHuntersLodgeHuntEvent(event)) {
      if (event.huntingPartyLevel > huntersLodgeLevel) {
        throw new Error("Hunter's Lodge level is too low");
      }

      const hasOngoingHunt = database.selectValue({
        sql: selectVillageEventExistsByTypeQuery,
        bind: {
          $village_id: villageId,
          $type: 'huntersLodgeHunt',
        },
        schema: z.coerce.boolean(),
      });

      if (hasOngoingHunt) {
        throw new Error("Hunter's Lodge is busy");
      }
    }

    return;
  }

  if (isTrapperCageProductionEvent(event)) {
    const { villageId, cageAmount } = event;

    if (cageAmount <= 0) {
      throw new Error('Trapper cage amount must be positive');
    }

    const trapperLevel =
      database.selectValue({
        sql: selectVillageBuildingLevelQuery,
        bind: {
          $village_id: villageId,
          $building_id: 'TRAPPER',
        },
        schema: z.number().nullable(),
      }) ?? 0;

    if (trapperLevel <= 0) {
      throw new Error('Trapper does not exist');
    }

    const currentCageAmount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM trapper_cages
        WHERE village_id = $village_id;
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    })!;

    const queuedCageAmount =
      database.selectValue({
        sql: `
          SELECT COALESCE(SUM(CAST(JSON_EXTRACT(meta, '$.cageAmount') AS INTEGER)), 0)
          FROM
            events
          WHERE
            village_id = $village_id
            AND type = 'trapperCageProduction';
        `,
        bind: {
          $village_id: villageId,
        },
        schema: z.number(),
      }) ?? 0;

    const capacity = calculateTrapperCapacity(trapperLevel);

    if (currentCageAmount + queuedCageAmount + cageAmount > capacity) {
      throw new Error('Trapper cage capacity exceeded');
    }

    return;
  }

  if (isGatherersHutGatheringTripEvent(event)) {
    const { villageId, troops } = event;

    const gatherersHutLevel = database.selectValue({
      sql: selectVillageBuildingLevelQuery,
      bind: {
        $village_id: villageId,
        $building_id: 'GATHERERS_HUT',
      },
      schema: z.number().nullable(),
    })!;

    if (gatherersHutLevel == null) {
      throw new Error("Gatherer's Hut does not exist");
    }

    const hasOngoingGatheringTrip = database.selectValue({
      sql: selectVillageEventExistsByTypeQuery,
      bind: {
        $village_id: villageId,
        $type: 'gatherersHutGatheringTrip',
      },
      schema: z.coerce.boolean(),
    });

    if (hasOngoingGatheringTrip) {
      throw new Error("Gatherer's Hut is busy");
    }

    if (!Array.isArray(troops) || troops.length === 0) {
      throw new Error('Gathering trip must include troops');
    }

    const villageTileId = database.selectValue({
      sql: selectVillageTileIdQuery,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    })!;

    const playerTribe = database.selectValue({
      sql: selectTribeByVillageId,
      bind: {
        $village_id: villageId,
      },
      schema: playableTribeSchema,
    })!;

    let troopAmount = 0;
    const troopAmountsByUnitId = new Map<string, number>();

    for (const troop of troops) {
      if (!Number.isInteger(troop.amount) || troop.amount <= 0) {
        throw new Error('Gathering trip troop amount must be positive');
      }

      const unit = getUnitDefinition(troop.unitId);

      if (unit.id === 'HERO') {
        throw new Error('Gathering trips can only include regular troops');
      }

      if (unit.tribe !== playerTribe) {
        throw new Error(
          "Gathering trips can only include troops from player's tribe",
        );
      }

      if (troop.tileId !== villageTileId || troop.source !== villageTileId) {
        throw new Error('Gathering trips can only include idle home troops');
      }

      troopAmount += troop.amount;
      troopAmountsByUnitId.set(
        troop.unitId,
        (troopAmountsByUnitId.get(troop.unitId) ?? 0) + troop.amount,
      );
    }

    const maxPartySize = calculateGatherersHutPartySize(gatherersHutLevel);

    if (troopAmount > maxPartySize) {
      throw new Error("Gatherer's Hut party size exceeded");
    }

    if (troopAmountsByUnitId.size === 1) {
      const [unitId, amount] = troopAmountsByUnitId.entries().next().value!;
      const availableTroops = database.selectValue({
        sql: `
          SELECT COALESCE(SUM(t.amount), 0)
          FROM
            troops t
            JOIN unit_ids ui ON ui.id = t.unit_id
          WHERE
            ui.unit = $unit_id
            AND t.tile_id = $tile_id
            AND t.source_tile_id = $tile_id;
        `,
        bind: {
          $unit_id: unitId,
          $tile_id: villageTileId,
        },
        schema: z.number(),
      })!;

      if (amount > availableTroops) {
        throw new Error('Not enough idle troops available');
      }
      return;
    }

    const hasUnavailableTroops = database.selectValue({
      sql: `
        WITH requested_troops AS (
          SELECT
            unit_ids.id AS unit_id,
            SUM(json_extract(troop.value, '$.amount')) AS amount
          FROM
            json_each($troops) AS troop
            JOIN unit_ids
              ON unit_ids.unit = json_extract(troop.value, '$.unitId')
          GROUP BY unit_ids.id
        )
        SELECT EXISTS (
          SELECT 1
          FROM
            requested_troops
            LEFT JOIN troops
              ON troops.unit_id = requested_troops.unit_id
              AND troops.tile_id = $tile_id
              AND troops.source_tile_id = $tile_id
          GROUP BY requested_troops.unit_id, requested_troops.amount
          HAVING COALESCE(SUM(troops.amount), 0) < requested_troops.amount
        );
      `,
      bind: {
        $troops: JSON.stringify(
          [...troopAmountsByUnitId].map(([unitId, amount]) => ({
            unitId,
            amount,
          })),
        ),
        $tile_id: villageTileId,
      },
      schema: z.coerce.boolean(),
    })!;

    if (hasUnavailableTroops) {
      throw new Error('Not enough idle troops available');
    }

    return;
  }

  if (isBuildingEvent(event)) {
    const { villageId, buildingFieldId, buildingId, level } = event;

    if (isBuildingDowngradeEvent(event)) {
      const mainBuildingLevel = database.selectValue({
        sql: selectVillageBuildingLevelQuery,
        bind: {
          $village_id: villageId,
          $building_id: 'MAIN_BUILDING',
        },
        schema: z.number().nullable(),
      })!;

      if (mainBuildingLevel === null || mainBuildingLevel < 10) {
        throw new Error(
          'Main building level 10 is required to downgrade buildings',
        );
      }

      const hasOngoingDowngradeEvent = database.selectValue({
        sql: `
          SELECT
            EXISTS
            (
              SELECT 1
              FROM
                events e
              WHERE
                e.village_id = $village_id
                AND e.type IN ('buildingLevelChange', 'buildingDestruction')
                AND CAST(JSON_EXTRACT(e.meta, '$.previousLevel') AS INTEGER) >
                    CAST(JSON_EXTRACT(e.meta, '$.level') AS INTEGER)
              ) AS event_exists;
        `,
        bind: {
          $village_id: villageId,
        },
        schema: z.coerce.boolean(),
      });

      if (hasOngoingDowngradeEvent) {
        throw new Error('Main building is busy');
      }

      return;
    }

    const buildingEventsCount = database.selectValue({
      sql: `
        SELECT
          COUNT(*) AS buildingEventsCount
        FROM
          (
            SELECT *,
              CAST(JSON_EXTRACT(meta, '$.buildingFieldId') AS INTEGER) AS building_field_id
            FROM
              events
            WHERE
              village_id = $village_id
            ) e
            JOIN villages v ON v.id = e.village_id
            JOIN players p ON p.id = v.player_id
            JOIN tribe_ids ti ON p.tribe_id = ti.id
        WHERE
          e.type IN ('buildingConstruction', 'buildingLevelChange')
          AND NOT (
            e.type IN ('buildingLevelChange', 'buildingDestruction')
                  AND CAST(JSON_EXTRACT(e.meta, '$.previousLevel') AS INTEGER) >
                      CAST(JSON_EXTRACT(e.meta, '$.level') AS INTEGER)
                )
              AND (
                -- If player is not Romans, include all building events
                ti.tribe <> 'romans'
              -- If Romans, only include events from the same "half" (<=18 or >18)
              OR (
              (e.building_field_id <= 18 AND CAST($building_field_id AS INTEGER) <= 18)
                OR
              (e.building_field_id > 18 AND CAST($building_field_id AS INTEGER) > 18)
              )
            );
      `,
      bind: {
        $village_id: villageId,
        $building_field_id: buildingFieldId,
      },
      schema: z.number(),
    })!;

    if (buildingEventsCount >= 1) {
      throw new BuildingConstructionQueueFullError();
    }

    const isFreeBuildingConstructionEnabled = database.selectValue({
      sql: `
        SELECT is_free_building_construction_enabled
        FROM developer_settings;
      `,
      schema: z.coerce.boolean(),
    })!;

    if (!isFreeBuildingConstructionEnabled) {
      const wheatProductionEffects = database.selectObjects({
        sql: selectAllRelevantEffectsByIdQuery,
        bind: {
          $effect_id: 'wheatProduction',
          $village_id: villageId,
        },
        schema: apiEffectSchema,
      });
      const { total: freeCrop } = calculateComputedEffect(
        'wheatProduction',
        wheatProductionEffects,
        villageId,
      );
      const requiredFreeCrop = calculatePopulationDifference(
        buildingId,
        event.previousLevel,
        level,
      );

      if (freeCrop < requiredFreeCrop) {
        throw new Error('Not enough free crop');
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

      assertBuildingConstructionRequirementsAreMet(
        database,
        villageId,
        buildingId,
        { buildingFieldId },
      );

      return;
    }

    const { maxLevel } = getBuildingDefinition(buildingId);

    if (level > maxLevel) {
      throw new Error('Building level cannot exceed max level');
    }

    return;
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

    return;
  }

  if (isAdventureTroopMovementEvent(event)) {
    const { available: adventurePoints } = getPlayerHeroAdventureStateAt(
      database,
      Date.now(),
    );

    if (adventurePoints === 0) {
      throw new Error('No adventure points available');
    }

    const isHeroHome = database.selectValue({
      sql: `
        SELECT
          EXISTS
          (
            SELECT 1
            FROM
              heroes h
                JOIN villages v ON v.id = h.village_id
                JOIN troops t
                     ON t.tile_id = v.tile_id
                       AND t.source_tile_id = v.tile_id
                JOIN unit_ids ui ON ui.id = t.unit_id
            WHERE
              h.player_id = $player_id
              AND ui.unit = 'HERO'
              AND t.amount > 0
          ) AS is_hero_home;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.coerce.boolean(),
    });

    if (!isHeroHome) {
      throw new Error('Hero is not stationed in his home village');
    }

    return;
  }

  if (isResourceTransferEvent(event)) {
    const { village, merchant } = getVillageMerchantStats(
      database,
      event.villageId,
    );
    const totalResourceAmount = getTotalResourceAmount(event.resources);
    const isReturnTransfer = totalResourceAmount === 0;

    const targetVillage = getMarketplaceVillage(
      database,
      event.targetVillageId,
    );

    if (!targetVillage || targetVillage.playerId !== village.playerId) {
      throw new Error(
        'Target village does not exist or does not belong to player',
      );
    }

    if (targetVillage.tileId !== event.targetTileId) {
      throw new Error('Target tile does not belong to target village');
    }

    if (isReturnTransfer) {
      if (event.targetVillageId !== event.villageId) {
        throw new Error('Merchant return must target the source village');
      }

      if (event.targetTileId !== village.tileId) {
        throw new Error('Merchant return target tile must be source village');
      }

      if (event.merchantAmount <= 0) {
        throw new Error('Merchant return must include merchants');
      }

      return;
    }

    if (event.targetVillageId === event.villageId) {
      throw new Error('Target village must be different from source village');
    }

    if (village.tileId !== event.originTileId) {
      throw new Error('Origin tile does not belong to source village');
    }

    const merchantAmount = getMerchantAmount(
      event.resources,
      merchant.merchantCapacity,
    );

    if (event.merchantAmount !== merchantAmount) {
      throw new Error('Invalid merchant amount');
    }

    if (merchantAmount > getFreeMerchantAmount(database, event.villageId)) {
      throw new Error('Not enough free merchants');
    }

    return;
  }

  if (isTradeRouteEvent(event)) {
    const { village, merchant, marketplaceLevel } = getVillageMerchantStats(
      database,
      event.villageId,
    );
    const targetVillage = getMarketplaceVillage(
      database,
      event.targetVillageId,
    );

    if (!targetVillage || targetVillage.playerId !== village.playerId) {
      throw new Error(
        'Target village does not exist or does not belong to player',
      );
    }

    if (event.targetVillageId === event.villageId) {
      throw new Error('Target village must be different from source village');
    }

    if (village.tileId !== event.originTileId) {
      throw new Error('Origin tile does not belong to source village');
    }

    if (targetVillage.tileId !== event.targetTileId) {
      throw new Error('Target tile does not belong to target village');
    }

    if (getTotalResourceAmount(event.resources) <= 0) {
      throw new Error('Trade route must include resources');
    }

    if (!Number.isFinite(event.interval) || event.interval <= 0) {
      throw new Error('Trade route interval must be positive');
    }

    const merchantAmount = getMerchantAmount(
      event.resources,
      merchant.merchantCapacity,
    );

    if (merchantAmount > marketplaceLevel) {
      throw new Error('Not enough merchants');
    }

    return;
  }

  if (isTroopMovementEvent(event)) {
    const errors = validateTroopMovement(database, event);

    if (errors.length > 0) {
      throw new Error(errors[0]);
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
    calculateVillageResourcesAt(database, villageId!, startsAt);

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

  if (isAdventureTroopMovementEvent(event)) {
    const heroId = database.selectValue({
      sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
      bind: {
        $player_id: PLAYER_ID,
      },
      schema: z.number(),
    })!;

    const now = Date.now();
    const { available } = materializeHeroAdventurePointsAt(
      database,
      heroId,
      now,
    );

    if (available <= 0) {
      throw new Error('No adventure points available');
    }

    database.exec({
      sql: `
        UPDATE hero_adventures
        SET
          available = available - 1,
          last_updated_at = $now
        WHERE
          hero_id = $hero_id
      `,
      bind: {
        $hero_id: heroId,
        $now: now,
      },
    });
  }

  if (isTroopMovementEvent(event) && !isReturnTroopMovementEvent(event)) {
    const troopMovementEvents = events as TroopMovementEvent[];

    removeTroops(
      database,
      troopMovementEvents.flatMap(({ troops }) => troops),
    );
  }

  if (isGatherersHutGatheringTripEvent(event)) {
    removeTroops(database, event.troops);
  }

  if (isTroopTrainingEvent(event)) {
    const now = Date.now();

    if (isHealingTroopTrainingBuilding(event.buildingId)) {
      materializeWoundedTroopsAt(database, event.villageId, now);
      removeWoundedTroops(database, [
        {
          villageId: event.villageId,
          unitId: event.unitId,
          amount: event.amount,
        },
      ]);

      return;
    }

    assessQueuedTroopCountQuestCompletion(database, now);
    assessQueuedTroopCountByIdQuestCompletion(database, event.unitId, now);
  }
};

// WARNING: `event` does not include `startsAt` and `duration` at this point in the flow!
export const getEventCost = (
  database: DbFacade,
  event: GameEvent,
): number[] => {
  if (isBuildingLevelChangeEvent(event)) {
    if (isBuildingDowngradeEvent(event)) {
      return [0, 0, 0, 0];
    }

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

  if (isAnimalCageProductionEvent(event)) {
    const isFreeUnitTrainingEnabled = database.selectValue({
      sql: 'SELECT is_free_unit_training_enabled FROM developer_settings',
      schema: z.coerce.boolean(),
    });

    if (isFreeUnitTrainingEnabled) {
      return [0, 0, 0, 0];
    }

    return ANIMAL_CAGE_COST.map((cost) => cost * event.cageAmount);
  }

  if (isTrapperCageProductionEvent(event)) {
    const isFreeUnitTrainingEnabled = database.selectValue({
      sql: 'SELECT is_free_unit_training_enabled FROM developer_settings',
      schema: z.coerce.boolean(),
    });

    if (isFreeUnitTrainingEnabled) {
      return [0, 0, 0, 0];
    }

    return TRAPPER_CAGE_COST.map((cost) => cost * event.cageAmount);
  }

  if (isHuntersLodgeHuntEvent(event)) {
    const isFreeHuntingPartiesEnabled = database.selectValue({
      sql: 'SELECT is_free_hunting_parties_enabled FROM developer_settings',
      schema: z.coerce.boolean(),
    });

    if (isFreeHuntingPartiesEnabled) {
      return [0, 0, 0, 0];
    }

    return calculateHuntersLodgeHuntCost(event.huntingPartyLevel);
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

  if (isResourceTransferEvent(event)) {
    const { wood, clay, iron, wheat } = event.resources;

    return [wood, clay, iron, wheat];
  }

  if (isTradeRouteEvent(event)) {
    return [0, 0, 0, 0];
  }

  return [0, 0, 0, 0];
};

// WARNING: `event` does not include `startsAt` and `duration` at this point in the flow!
export const getEventDuration = (
  database: DbFacade,
  event: GameEvent,
): number => {
  if (isBuildingConstructionEvent(event)) {
    return 0;
  }

  if (isBuildingLevelChangeEvent(event) || isBuildingDestructionEvent(event)) {
    const isInstantBuildingConstructionEnabled = database.selectValue({
      sql: 'SELECT is_instant_building_construction_enabled FROM developer_settings',
      schema: z.coerce.boolean(),
    });

    if (isInstantBuildingConstructionEnabled) {
      return 0;
    }

    if (isBuildingDowngradeEvent(event)) {
      const speed = database.selectValue({
        sql: 'SELECT speed FROM servers LIMIT 1;',
        schema: speedSchema,
      })!;

      return calculateBuildingDestructionDuration(
        event.previousLevel - event.level,
        speed,
      );
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

    const { unitId, villageId, durationEffectId, buildingId } = event;

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

    const durationModifier = isHealingTroopTrainingBuilding(buildingId)
      ? 0.5
      : 1;

    return total * baseRecruitmentDuration * durationModifier;
  }

  if (isAnimalCageProductionEvent(event)) {
    const isInstantUnitTrainingEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_training_enabled FROM developer_settings',
      schema: z.coerce.boolean(),
    });

    if (isInstantUnitTrainingEnabled) {
      return 0;
    }

    const speed = database.selectValue({
      sql: 'SELECT speed FROM servers LIMIT 1;',
      schema: speedSchema,
    })!;

    return (ANIMAL_CAGE_BASE_DURATION * event.cageAmount) / speed;
  }

  if (isTrapperCageProductionEvent(event)) {
    const isInstantUnitTrainingEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_training_enabled FROM developer_settings',
      schema: z.coerce.boolean(),
    });

    if (isInstantUnitTrainingEnabled) {
      return 0;
    }

    const speed = database.selectValue({
      sql: 'SELECT speed FROM servers LIMIT 1;',
      schema: speedSchema,
    })!;

    return (TRAPPER_CAGE_BASE_DURATION * event.cageAmount) / speed;
  }

  if (isHuntersLodgeHuntEvent(event)) {
    const isInstantUnitTravelEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_travel_enabled FROM developer_settings',
      schema: z.coerce.boolean(),
    });

    if (isInstantUnitTravelEnabled) {
      return 0;
    }

    const speed = database.selectValue({
      sql: 'SELECT speed FROM servers LIMIT 1;',
      schema: speedSchema,
    })!;

    return calculateHuntersLodgeHuntDuration(event.huntingPartyLevel, speed);
  }

  if (isGatherersHutGatheringTripEvent(event)) {
    const isInstantUnitTravelEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_travel_enabled FROM developer_settings',
      schema: z.coerce.boolean(),
    });

    if (isInstantUnitTravelEnabled) {
      return 0;
    }

    const { completedGatheringTripCount, seed, speed } = database.selectObject({
      sql: `
        SELECT
          (
            SELECT seed
            FROM
              servers
            LIMIT 1
          ) AS seed,
          (
            SELECT speed
            FROM
              servers
            LIMIT 1
          ) AS speed,
          COALESCE((
            SELECT completed
            FROM
              gatherers_hut_expeditions
            WHERE
              village_id = $village_id
          ), 0) AS completedGatheringTripCount;
      `,
      bind: {
        $village_id: event.villageId,
      },
      schema: z.strictObject({
        seed: z.string(),
        speed: speedSchema,
        completedGatheringTripCount: z.number(),
      }),
    })!;

    return calculateGatherersHutGatheringDuration(
      seed,
      speed,
      event.villageId,
      completedGatheringTripCount,
    );
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
      event.originalMovementType === 'troopMovementAdventure'
    ) {
      return calculateAdventureDuration(database, true);
    }

    const { villageId, targetTileId, originTileId, troops } = event;

    const effects = database.selectObjects({
      sql: selectUnitSpeedRelevantEffectsQuery,
      bind: {
        $village_id: villageId,
      },
      schema: effectSchema,
    });

    const mapSize = database.selectValue({
      sql: selectServerMapSizeQuery,
      schema: z.number(),
    })!;

    return calculateTravelDuration({
      originVillageId: villageId,
      targetTileId,
      originTileId,
      mapSize,
      troops,
      effects,
    });
  }

  if (isResourceTransferEvent(event)) {
    const { merchant } = getVillageMerchantStats(database, event.villageId);

    return getMerchantMovementDuration(
      database,
      event.originTileId,
      event.targetTileId,
      merchant.merchantSpeed,
    );
  }

  if (isTradeRouteEvent(event)) {
    return 0;
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
      schema: z.strictObject({
        healthRegeneration: z.number(),
        speed: speedSchema,
      }),
    })!;

    return calculateHealthRegenerationEventDuration(healthRegeneration, speed);
  }

  if (isLoyaltyIncreaseEvent(event)) {
    const { createdAt, speed } = database.selectObject({
      sql: 'SELECT created_at AS createdAt, speed FROM servers LIMIT 1;',
      schema: z.strictObject({
        createdAt: z.number(),
        speed: speedSchema,
      }),
    })!;

    const loyaltyIncreaseDuration =
      calculateLoyaltyIncreaseEventDuration(speed);
    const elapsedSinceServerStart = Date.now() - createdAt;
    const timeUntilNextIncrease =
      (loyaltyIncreaseDuration -
        (elapsedSinceServerStart % loyaltyIncreaseDuration)) %
      loyaltyIncreaseDuration;

    return timeUntilNextIncrease || loyaltyIncreaseDuration;
  }

  throw new Error(
    `Missing duration calculation for event type "${event.type}"`,
  );
};

export const getEventResourceSubtractionTimestamp = (
  _database: DbFacade,
  event: GameEvent,
  startsAt: number,
) => {
  if (isBuildingLevelChangeEvent(event)) {
    return startsAt;
  }

  return Date.now();
};

// WARNING: `event` does not include `startsAt` and `duration` at this point in the flow!
export const getEventStartTime = (
  database: DbFacade,
  event: GameEvent,
): number => {
  if (isTroopTrainingEvent(event)) {
    const { villageId, buildingId } = event;

    const eventRows = database.selectObjects({
      sql: selectAllVillageEventsByTypeQuery,
      bind: {
        $village_id: villageId,
        $type: 'troopTraining',
      },
      schema: baseEventRowSchema,
    });
    const events = eventRows.map(
      mapEventRowToTypedEvent,
    ) as GameEvent<'troopTraining'>[];

    const relevantTrainingEvents = events.filter((event) => {
      return event.buildingId === buildingId;
    });

    if (relevantTrainingEvents.length > 0) {
      const lastEvent = relevantTrainingEvents.at(-1)!;
      return lastEvent.startsAt + lastEvent.duration;
    }

    return Date.now();
  }

  if (isAnimalCageProductionEvent(event)) {
    const { villageId } = event;
    const now = Date.now();

    return database.selectValue({
      sql: `
        SELECT COALESCE(MAX(resolves_at), $now) AS resolves_at
        FROM
          events
        WHERE
          village_id = $village_id
          AND type = 'animalCageProduction';
      `,
      bind: {
        $village_id: villageId,
        $now: now,
      },
      schema: z.number(),
    })!;
  }

  if (isTrapperCageProductionEvent(event)) {
    const { villageId } = event;
    const now = Date.now();

    return database.selectValue({
      sql: `
        SELECT COALESCE(MAX(resolves_at), $now) AS resolves_at
        FROM
          events
        WHERE
          village_id = $village_id
          AND type = 'trapperCageProduction';
      `,
      bind: {
        $village_id: villageId,
        $now: now,
      },
      schema: z.number(),
    })!;
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

  if (isHeroHealthRegenerationEvent(event)) {
    const { resolvesAt } = event;

    return resolvesAt;
  }

  if (isBuildingConstructionEvent(event)) {
    return Date.now();
  }

  if (isBuildingLevelChangeEvent(event)) {
    return Date.now();
  }

  if (isTroopMovementEvent(event)) {
    if (isReturnTroopMovementEvent(event)) {
      if (isManuallyTriggeredReturnTroopMovementEvent(event)) {
        return Date.now();
      }

      const { resolvesAt } = event;

      return resolvesAt;
    }

    return Date.now();
  }

  if (isResourceTransferEvent(event)) {
    if (getTotalResourceAmount(event.resources) === 0) {
      return event.resolvesAt ?? Date.now();
    }

    return Date.now();
  }

  if (isTradeRouteEvent(event)) {
    return event.startsAt ?? Date.now();
  }

  return Date.now();
};
