import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { newVillageQuestsFactory } from '@pillage-first/game-assets/quests';
import { getBuildingDefinition } from '@pillage-first/game-assets/utils/buildings';
import {
  calculateTotalCarryCapacity,
  distributeLoot,
} from '@pillage-first/game-assets/utils/troops';
import { buildingFieldsFactory } from '@pillage-first/game-assets/village';
import {
  type Building,
  buildingIdSchema,
} from '@pillage-first/types/models/building';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { ResourceBundle } from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { playableTribeSchema } from '@pillage-first/types/models/tribe';
import type { UnitId } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  insertEffectQuery,
  selectWheatProductionEffectIdQuery,
  updateVillageWheatProductionByTroopsAndVillageIdEffectQuery,
} from '../../../queries/effect-queries';
import {
  selectPlayerVillageIdByTileIdQuery,
  selectVillageIdAndTileIdQuery,
} from '../../../queries/village-queries';
import { createEvents } from '../../../utils/create-event';
import {
  createHeroHealthRegenerationEventByVillageId,
  onHeroDeath,
  relocateHero,
} from '../../../utils/hero';
import { assessAdventureCountQuestCompletion } from '../../../utils/quests';
import { moveTroopWheatConsumption } from '../../../utils/reinforcements';
import {
  insertAdventureReport,
  insertBattleReport,
  insertMovementReport,
} from '../../../utils/report';
import { addTroops } from '../../../utils/troops';
import {
  addVillageResourcesAt,
  calculateVillageResourcesAt,
  subtractVillageResourcesAt,
  updateVillageResourcesAt,
} from '../../../utils/village';
import type { Resolver } from '../resolver';

type BattleReportUnit = {
  unitId: UnitId;
  amountBefore: number;
  amountAfter: number;
};

type DefenderReinforcementReportParticipant = {
  tileId: number;
  playerId: number | null;
  units: BattleReportUnit[];
};

const emptyLoot = (): ResourceBundle => [0, 0, 0, 0];

const stealResourcesFromTarget = (
  database: DbFacade,
  targetTileId: number,
  timestamp: number,
  carryCapacity: number,
): ResourceBundle => {
  if (carryCapacity <= 0) {
    return emptyLoot();
  }

  const targetVillageId = database.selectValue({
    sql: 'SELECT id FROM villages WHERE tile_id = $target_tile_id;',
    bind: { $target_tile_id: targetTileId },
    schema: z.number().nullable(),
  });

  if (targetVillageId != null) {
    const { currentWood, currentClay, currentIron, currentWheat } =
      calculateVillageResourcesAt(database, targetVillageId, timestamp);
    const loot = distributeLoot(
      [currentWood, currentClay, currentIron, currentWheat],
      carryCapacity,
    );

    subtractVillageResourcesAt(database, targetVillageId, timestamp, loot);

    return loot;
  }

  const resourceSite = database.selectObject({
    sql: `
      SELECT wood, clay, iron, wheat
      FROM resource_sites
      WHERE tile_id = $target_tile_id;
    `,
    bind: { $target_tile_id: targetTileId },
    schema: z.strictObject({
      wood: z.number(),
      clay: z.number(),
      iron: z.number(),
      wheat: z.number(),
    }),
  });

  if (!resourceSite) {
    return emptyLoot();
  }

  const loot = distributeLoot(
    [
      resourceSite.wood,
      resourceSite.clay,
      resourceSite.iron,
      resourceSite.wheat,
    ],
    carryCapacity,
  );

  database.exec({
    sql: `
      UPDATE resource_sites
      SET
        wood = wood - $wood,
        clay = clay - $clay,
        iron = iron - $iron,
        wheat = wheat - $wheat,
        updated_at = $updated_at
      WHERE tile_id = $target_tile_id;
    `,
    bind: {
      $target_tile_id: targetTileId,
      $wood: loot[0],
      $clay: loot[1],
      $iron: loot[2],
      $wheat: loot[3],
      $updated_at: timestamp,
    },
  });

  return loot;
};

const mapTroopsToBattleReportUnits = (
  troops: GameEvent<'troopMovementAttack'>['troops'],
): BattleReportUnit[] => {
  const amountByUnitId = new Map<UnitId, number>();

  for (const troop of troops) {
    amountByUnitId.set(
      troop.unitId,
      (amountByUnitId.get(troop.unitId) ?? 0) + troop.amount,
    );
  }

  return [...amountByUnitId.entries()].map(([unitId, amount]) => ({
    unitId,
    amountBefore: amount,
    amountAfter: amount,
  }));
};

const getPlayerIdByVillageId = (
  database: DbFacade,
  villageId: number,
): number => {
  return database.selectValue({
    sql: 'SELECT player_id FROM villages WHERE id = $village_id;',
    bind: { $village_id: villageId },
    schema: z.number(),
  })!;
};

const getTargetOwnerPlayerId = (
  database: DbFacade,
  targetTileId: number,
): number | null => {
  return (
    database.selectValue({
      sql: `
        SELECT COALESCE(target_v.player_id, oasis_owner_v.player_id)
        FROM
          tiles t
          LEFT JOIN villages target_v ON target_v.tile_id = t.id
          LEFT JOIN villages oasis_owner_v ON oasis_owner_v.id = (
            SELECT MAX(village_id)
            FROM oasis
            WHERE tile_id = t.id
          )
        WHERE t.id = $target_tile_id;
      `,
      bind: { $target_tile_id: targetTileId },
      schema: z.number().nullable(),
    }) ?? null
  );
};

const getHomeDefenderUnits = (
  database: DbFacade,
  targetTileId: number,
): BattleReportUnit[] => {
  return database
    .selectObjects({
      sql: `
        SELECT ui.unit AS unit_id, SUM(t.amount) AS amount
        FROM
          troops t
          JOIN unit_ids ui ON ui.id = t.unit_id
        WHERE
          t.tile_id = $target_tile_id
          AND t.source_tile_id = $target_tile_id
        GROUP BY ui.unit;
      `,
      bind: { $target_tile_id: targetTileId },
      schema: z.strictObject({
        unit_id: z.string(),
        amount: z.number(),
      }),
    })
    .map(({ unit_id, amount }) => ({
      unitId: unit_id as UnitId,
      amountBefore: amount,
      amountAfter: amount,
    }));
};

const getDefenderReinforcements = (
  database: DbFacade,
  targetTileId: number,
): DefenderReinforcementReportParticipant[] => {
  const rows = database.selectObjects({
    sql: `
      SELECT
        t.source_tile_id,
        v.player_id,
        ui.unit AS unit_id,
        SUM(t.amount) AS amount
      FROM
        troops t
        JOIN unit_ids ui ON ui.id = t.unit_id
        LEFT JOIN villages v ON v.tile_id = t.source_tile_id
      WHERE
        t.tile_id = $target_tile_id
        AND t.source_tile_id != $target_tile_id
      GROUP BY t.source_tile_id, v.player_id, ui.unit;
    `,
    bind: { $target_tile_id: targetTileId },
    schema: z.strictObject({
      source_tile_id: z.number(),
      player_id: z.number().nullable(),
      unit_id: z.string(),
      amount: z.number(),
    }),
  });

  const reinforcementsByTileId = new Map<
    number,
    DefenderReinforcementReportParticipant
  >();

  for (const row of rows) {
    let reinforcement = reinforcementsByTileId.get(row.source_tile_id);

    if (!reinforcement) {
      reinforcement = {
        tileId: row.source_tile_id,
        playerId: row.player_id,
        units: [],
      };
      reinforcementsByTileId.set(row.source_tile_id, reinforcement);
    }

    reinforcement.units.push({
      unitId: row.unit_id as UnitId,
      amountBefore: row.amount,
      amountAfter: row.amount,
    });
  }

  return [...reinforcementsByTileId.values()];
};

const resolveNoCombatOffensiveMovement = (
  database: Parameters<Resolver<GameEvent<'troopMovementAttack'>>>[0],
  args: GameEvent<'troopMovementAttack'> | GameEvent<'troopMovementRaid'>,
): ResourceBundle => {
  const { villageId, resolvesAt, originTileId, targetTileId, troops } = args;

  const loot = stealResourcesFromTarget(
    database,
    targetTileId,
    resolvesAt,
    calculateTotalCarryCapacity(troops),
  );

  insertBattleReport(database, {
    villageId,
    timestamp: resolvesAt,
    outcome: 'attackerNoLoss',
    originTileId,
    targetTileId,
    isRaid: args.type === 'troopMovementRaid',
    loot,
    canAttackerSeeFullReport: true,
    attackerPoints: 0,
    defenderPoints: 0,
    attacker: {
      playerId: getPlayerIdByVillageId(database, villageId),
      tileId: originTileId,
      units: mapTroopsToBattleReportUnits(troops),
    },
    defender: {
      playerId: getTargetOwnerPlayerId(database, targetTileId),
      tileId: targetTileId,
      units: getHomeDefenderUnits(database, targetTileId),
    },
    reinforcements: getDefenderReinforcements(database, targetTileId),
  });

  return loot;
};

export const adventureMovementResolver: Resolver<
  GameEvent<'troopMovementAdventure'>
> = (database, args) => {
  const { villageId, resolvesAt, originTileId, targetTileId, troops } = args;

  const { heroId, healthBefore, adventureId } = database.selectObject({
    sql: `
      SELECT
        h.id AS heroId,
        h.health AS healthBefore,
        ha.completed + 1 AS adventureId
      FROM
        heroes h
        JOIN hero_adventures ha ON h.id = ha.hero_id
      WHERE
        h.player_id = (
          SELECT player_id
          FROM villages
          WHERE id = $village_id
        );
    `,
    bind: { $village_id: villageId },
    schema: z.strictObject({
      heroId: z.number(),
      healthBefore: z.number(),
      adventureId: z.int(),
    }),
  })!;

  const healthAfter = database.selectValue({
    sql: `
      UPDATE heroes
      SET
        health = MAX(0, health - MAX(0, 5 - damage_reduction)),
        experience =
          experience +
          CASE
            WHEN MAX(0, health - MAX(0, 5 - damage_reduction)) > 0
              THEN (
                     SELECT completed + 1
                     FROM
                       hero_adventures
                     WHERE
                       hero_id = heroes.id
                     ) * 10
            ELSE 0
            END
      WHERE id = $hero_id
      RETURNING health
    `,
    bind: { $hero_id: heroId },
    schema: z.number(),
  })!;

  insertAdventureReport(database, {
    villageId,
    timestamp: resolvesAt,
    adventureId,
    itemId: null,
    itemAmount: null,
    healthBefore,
    healthAfter,
  });

  if (healthAfter === 0) {
    onHeroDeath(database, resolvesAt);

    return {
      affectedVillageIds: [villageId],
    };
  }

  database.exec({
    sql: 'UPDATE hero_adventures SET completed = completed + 1 WHERE hero_id = $hero_id;',
    bind: { $hero_id: heroId },
  });

  assessAdventureCountQuestCompletion(database, resolvesAt);

  if (healthAfter < 100) {
    createHeroHealthRegenerationEventByVillageId(
      database,
      villageId,
      resolvesAt,
    );
  }

  createEvents<'troopMovementReturn'>(database, {
    villageId,
    originTileId: targetTileId,
    startsAt: resolvesAt,
    targetTileId: originTileId,
    type: 'troopMovementReturn',
    originalMovementType: 'troopMovementAdventure',
    troops,
  });

  return {
    affectedVillageIds: [villageId],
  };
};

export const oasisOccupationMovementResolver: Resolver<
  GameEvent<'troopMovementOasisOccupation'>
> = (database, args) => {
  const targetVillageId = database.selectValues({
    sql: selectPlayerVillageIdByTileIdQuery,
    bind: { $tile_id: args.targetTileId, $player_id: PLAYER_ID },
    schema: z.number(),
  });

  return {
    affectedVillageIds: [...targetVillageId],
  };
};

export const findNewVillageMovementResolver: Resolver<
  GameEvent<'troopMovementFindNewVillage'>
> = (database, args) => {
  const { targetTileId, resolvesAt, villageId } = args;

  // tileId here represents a tile_id where the new village will be founded
  const {
    id: tileId,
    x,
    y,
    resourceFieldComposition,
    tribe,
  } = database.selectObject({
    sql: `
      SELECT
        t.id,
        t.x,
        t.y,
        rfc.resource_field_composition AS resourceFieldComposition,
        ti.tribe
      FROM
        tiles t
          JOIN resource_field_composition_ids rfc
               ON t.resource_field_composition_id = rfc.id
          CROSS JOIN players p
          JOIN tribe_ids ti
               ON p.tribe_id = ti.id
      WHERE
        t.id = $tile_id
        AND p.id = $player_id;
    `,
    bind: {
      $tile_id: targetTileId,
      $player_id: PLAYER_ID,
    },
    schema: z.strictObject({
      id: z.number(),
      x: z.number(),
      y: z.number(),
      resourceFieldComposition: resourceFieldCompositionSchema,
      tribe: playableTribeSchema,
    }),
  })!;

  // Create village with incremental slug v-{n}
  const newVillageId = database.selectValue({
    sql: `
      WITH
        next_slug AS (
          SELECT 'v-' || (COUNT(*) + 1) AS slug
          FROM
            villages
          WHERE
            player_id = $player_id
          )
      INSERT
      INTO
        villages (name, slug, tile_id, player_id)
      SELECT
        $name,
        (
          SELECT slug
          FROM
            next_slug
          ),
        $tile_id,
        $player_id
          RETURNING id;
    `,
    bind: {
      $name: 'New village',
      $tile_id: tileId,
      $player_id: PLAYER_ID,
    },
    schema: z.number(),
  })!;

  database.exec({
    sql: `
      INSERT INTO gatherers_hut_expeditions (village_id, completed)
      VALUES ($village_id, 0)
      ON CONFLICT(village_id) DO NOTHING;
    `,
    bind: {
      $village_id: newVillageId,
    },
  });

  const buildingIdRows = database.selectObjects({
    sql: 'SELECT id, building FROM building_ids',
    schema: z.strictObject({ id: z.number(), building: buildingIdSchema }),
  });

  const buildingIdMap = new Map<Building['id'], number>(
    buildingIdRows.map((b) => [b.building, b.id]),
  );

  const buildingFields = buildingFieldsFactory(
    'player',
    tribe,
    resourceFieldComposition,
  );

  const wheatProductionEffectId = database.selectValue({
    sql: selectWheatProductionEffectIdQuery,
    schema: z.number(),
  })!;

  database.exec({
    sql: `
      INSERT INTO building_fields (village_id, field_id, building_id, level)
      SELECT
        $village_id,
        json_extract(field.value, '$.fieldId'),
        json_extract(field.value, '$.buildingId'),
        json_extract(field.value, '$.level')
      FROM json_each($fields) AS field;
    `,
    bind: {
      $village_id: newVillageId,
      $fields: JSON.stringify(
        buildingFields.map(({ field_id, building_id, level }) => ({
          fieldId: field_id,
          buildingId: buildingIdMap.get(building_id)!,
          level,
        })),
      ),
    },
  });

  const buildingEffects = buildingFields.flatMap(
    ({ field_id, building_id, level }) =>
      getBuildingDefinition(building_id)
        .effects(tribe)
        .map((effect) => ({
          effectId: effect.effectId,
          value: effect.valuesPerLevel[level],
          type: effect.type,
          sourceSpecifier: field_id,
        })),
  );

  database.exec({
    sql: `
      INSERT INTO effects (
        effect_id,
        value,
        type_id,
        scope_id,
        source_id,
        village_id,
        source_specifier
      )
      SELECT
        effect_ids.id,
        json_extract(effect.value, '$.value'),
        effect_type_ids.id,
        effect_scope_ids.id,
        effect_source_ids.id,
        $village_id,
        json_extract(effect.value, '$.sourceSpecifier')
      FROM
        json_each($effects) AS effect
        JOIN effect_ids
          ON effect_ids.effect = json_extract(effect.value, '$.effectId')
        JOIN effect_type_ids
          ON effect_type_ids.type = json_extract(effect.value, '$.type')
        JOIN effect_scope_ids
          ON effect_scope_ids.scope = 'local'
        JOIN effect_source_ids
          ON effect_source_ids.source = 'building';
    `,
    bind: {
      $effects: JSON.stringify(buildingEffects),
      $village_id: newVillageId,
    },
  });

  // Initialize resource site for the new village (fresh-settlement baseline similar to starting village)
  database.exec({
    sql: `
      INSERT INTO
        resource_sites (tile_id, wood, clay, iron, wheat, updated_at)
      VALUES
        ($tile_id, 750, 750, 750, 750, $updatedAt)
      ON CONFLICT(tile_id) DO NOTHING;
    `,
    bind: { $tile_id: tileId, $updatedAt: resolvesAt },
  });

  const quests = newVillageQuestsFactory(
    newVillageId,
    tribe,
    resourceFieldComposition,
  );

  database.exec({
    sql: `
      INSERT INTO quests (quest_id, completed_at, collected_at, village_id)
      SELECT
        quest.value,
        CASE
          WHEN quest.value = 'oneOf-MAIN_BUILDING-1' THEN $resolves_at
          ELSE NULL
        END,
        NULL,
        $village_id
      FROM json_each($quests) AS quest;
    `,
    bind: {
      $quests: JSON.stringify(quests.map(({ id }) => id)),
      $resolves_at: resolvesAt,
      $village_id: newVillageId,
    },
  });

  // Population effect
  database.exec({
    sql: insertEffectQuery,
    bind: {
      $effect_id: wheatProductionEffectId,
      $value: -3,
      $type: 'base',
      $scope: 'local',
      $source: 'building',
      $village_id: newVillageId,
      $source_specifier: 0,
    },
  });

  // Troop wheat consumption effect
  database.exec({
    sql: insertEffectQuery,
    bind: {
      $effect_id: wheatProductionEffectId,
      $value: 0,
      $type: 'base',
      $scope: 'local',
      $source: 'troops',
      $village_id: newVillageId,
      $source_specifier: 0,
    },
  });

  // Reduce troop consumption in the source village by 3 (since 3 settlers are consumed)
  database.exec({
    sql: updateVillageWheatProductionByTroopsAndVillageIdEffectQuery,
    bind: {
      $increase_amount: -3,
      $village_id: villageId,
    },
  });

  updateVillageResourcesAt(database, villageId, resolvesAt);

  // Founding village history
  database.exec({
    sql: `
      INSERT INTO
        village_founding_history (village_id, tile_id, x, y, timestamp)
      VALUES
        ($village_id, $tile_id, $x, $y, $timestamp);
    `,
    bind: {
      $village_id: newVillageId,
      $tile_id: tileId,
      $x: x,
      $y: y,
      // JS stores values in ms, other history table triggers store it in seconds
      $timestamp: Math.trunc(resolvesAt / 1000),
    },
  });

  return {
    affectedVillageIds: [villageId, newVillageId],
  };
};

export const returnMovementResolver: Resolver<
  GameEvent<'troopMovementReturn'>
> = (database, args) => {
  const { villageId, targetTileId, troops, loot, resolvesAt } = args;

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
    })),
  );

  if (loot?.some((amount) => amount > 0)) {
    addVillageResourcesAt(database, villageId, resolvesAt, loot);
  }

  const targetVillageIds = database.selectValues({
    sql: selectPlayerVillageIdByTileIdQuery,
    bind: { $tile_id: targetTileId, $player_id: PLAYER_ID },
    schema: z.number(),
  });

  return {
    affectedVillageIds: [villageId, ...targetVillageIds],
  };
};

export const relocationMovementResolver: Resolver<
  GameEvent<'troopMovementRelocation'>
> = (database, args) => {
  const { targetTileId, troops, resolvesAt, villageId } = args;

  const targetVillageId = database.selectValue({
    sql: `
      SELECT
        CASE
          WHEN tt.type = 'free' THEN v.id
          WHEN tt.type = 'oasis' THEN (
            SELECT MAX(o.village_id)
            FROM
              oasis o
            WHERE
              o.tile_id = t.id
          )
        END
      FROM
        tiles t
          JOIN tile_type_ids tt ON tt.id = t.type_id
          LEFT JOIN villages v ON v.tile_id = t.id
      WHERE
        t.id = $tile_id;
    `,
    bind: { $tile_id: targetTileId },
    schema: z.number(),
  })!;

  insertMovementReport(database, {
    ...args,
    movementType: 'relocation',
  });

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
      source: targetTileId,
    })),
  );

  if (troops.some(({ unitId }) => unitId === 'HERO')) {
    relocateHero(database, villageId, targetVillageId, resolvesAt);
  }

  moveTroopWheatConsumption(
    database,
    troops,
    villageId,
    targetVillageId,
    resolvesAt,
  );

  return {
    affectedVillageIds: [villageId, targetVillageId],
  };
};

export const reinforcementMovementResolver: Resolver<
  GameEvent<'troopMovementReinforcements'>
> = (database, args) => {
  const { targetTileId, troops, resolvesAt, villageId } = args;

  const { tileType: targetTileType, villageId: targetVillageId } =
    database.selectObject({
      sql: selectVillageIdAndTileIdQuery,
      bind: { $tile_id: targetTileId },
      schema: z.strictObject({
        tileId: z.number(),
        tileType: z.enum(['free', 'oasis']),
        villageId: z.number(),
      }),
    })!;

  insertMovementReport(database, {
    ...args,
    movementType: 'reinforcement',
  });

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
    })),
  );

  if (targetTileType !== 'oasis') {
    moveTroopWheatConsumption(
      database,
      troops,
      villageId,
      targetVillageId,
      resolvesAt,
    );
  }

  return {
    affectedVillageIds: [
      villageId,
      targetTileType === 'oasis' ? null : targetVillageId,
    ],
  };
};

export const attackMovementResolver: Resolver<
  GameEvent<'troopMovementAttack'>
> = (database, args) => {
  const { villageId, resolvesAt, originTileId, targetTileId, troops } = args;

  const loot = resolveNoCombatOffensiveMovement(database, args);

  createEvents<'troopMovementReturn'>(database, {
    villageId,
    troops,
    targetTileId: originTileId,
    originTileId: targetTileId,
    startsAt: resolvesAt,
    type: 'troopMovementReturn',
    originalMovementType: 'troopMovementAttack',
    loot,
  });

  const targetVillageIds = database.selectValues({
    sql: selectPlayerVillageIdByTileIdQuery,
    bind: { $tile_id: targetTileId, $player_id: PLAYER_ID },
    schema: z.number(),
  });

  return { affectedVillageIds: [villageId, ...targetVillageIds] };
};

export const raidMovementResolver: Resolver<GameEvent<'troopMovementRaid'>> = (
  database,
  args,
) => {
  const { villageId, resolvesAt, troops, originTileId, targetTileId } = args;

  const loot = resolveNoCombatOffensiveMovement(database, args);

  createEvents<'troopMovementReturn'>(database, {
    villageId,
    troops,
    startsAt: resolvesAt,
    targetTileId: originTileId,
    originTileId: targetTileId,
    type: 'troopMovementReturn',
    originalMovementType: 'troopMovementRaid',
    loot,
  });

  const targetVillageIds = database.selectValues({
    sql: selectPlayerVillageIdByTileIdQuery,
    bind: { $tile_id: targetTileId, $player_id: PLAYER_ID },
    schema: z.number(),
  });

  return { affectedVillageIds: [villageId, ...targetVillageIds] };
};
