import { z } from 'zod';
import { buildingMap } from '@pillage-first/game-assets/buildings';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { newVillageQuestsFactory } from '@pillage-first/game-assets/quests';
import { buildingFieldsFactory } from '@pillage-first/game-assets/village';
import {
  type Building,
  buildingIdSchema,
} from '@pillage-first/types/models/building';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { playableTribeSchema } from '@pillage-first/types/models/tribe';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  insertEffectByEffectNameQuery,
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
import { insertReport } from '../../../utils/report';
import { addTroops } from '../../../utils/troops';
import { updateVillageResourcesAt } from '../../../utils/village';
import type { Resolver } from '../resolver';

const insertMovementReport = (
  database: DbFacade,
  {
    villageId,
    resolvesAt,
    originTileId,
    targetTileId,
    movementType,
    troops,
  }: Pick<
    GameEvent<'troopMovementRelocation'>,
    'villageId' | 'resolvesAt' | 'originTileId' | 'targetTileId' | 'troops'
  > & { movementType: 'reinforcement' | 'relocation' },
) => {
  const resolvedOriginTileId =
    originTileId ??
    database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id;',
      bind: { $village_id: villageId },
      schema: z.int(),
    })!;

  const reportId = insertReport(database, {
    villageId,
    timestamp: resolvesAt,
    type: 'movement',
    outcome: 'troopMovement',
    tags: [],
  });

  const movementReportId = database.selectValue({
    sql: `
      INSERT INTO movement_reports (
        report_id, origin_tile_id, target_tile_id, movement_type
      ) VALUES (
        $report_id, $origin_tile_id, $target_tile_id, $movement_type
      ) RETURNING id;
    `,
    bind: {
      $report_id: reportId,
      $origin_tile_id: resolvedOriginTileId,
      $target_tile_id: targetTileId,
      $movement_type: movementType,
    },
    schema: z.int(),
  })!;

  for (const troop of troops) {
    database.exec({
      sql: `
        INSERT INTO movement_report_units (movement_report_id, unit_id, amount)
        VALUES (
          $movement_report_id,
          (SELECT id FROM unit_ids WHERE unit = $unit_id),
          $amount
        );
      `,
      bind: {
        $movement_report_id: movementReportId,
        $unit_id: troop.unitId,
        $amount: troop.amount,
      },
    });
  }
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

  const reportId = insertReport(database, {
    villageId,
    timestamp: resolvesAt,
    type: 'adventure',
    outcome: 'heroAdventure',
    tags: [],
  });

  database.exec({
    sql: `
      INSERT INTO
        hero_adventure_reports (
          report_id,
          adventure_id,
          item_id,
          item_amount,
          health_before,
          health_after
        )
      VALUES
        (
          $report_id,
          $adventure_id,
          $item_id,
          $item_amount,
          $health_before,
          $health_after
        );
    `,
    bind: {
      $report_id: reportId,
      $adventure_id: adventureId,
      $item_id: null,
      $item_amount: null,
      $health_before: healthBefore,
      $health_after: healthAfter,
    },
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

  for (const { field_id, building_id, level } of buildingFields) {
    database.exec({
      sql: `
        INSERT INTO
          building_fields (village_id, field_id, building_id, level)
        VALUES
          ($village_id, $field_id, $buildingId, $level);
      `,
      bind: {
        $village_id: newVillageId,
        $field_id: field_id,
        $buildingId: buildingIdMap.get(building_id)!,
        $level: level,
      },
    });

    const building = buildingMap.get(building_id)!;

    for (const effect of building.effects) {
      database.exec({
        sql: insertEffectByEffectNameQuery,
        bind: {
          $effect_name: effect.effectId,
          $value: effect.valuesPerLevel[level],
          $type: effect.type,
          $scope: 'local',
          $source: 'building',
          $village_id: newVillageId,
          $source_specifier: field_id,
        },
      });
    }
  }

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

  for (const quest of quests) {
    const isCompleted = quest.id === 'oneOf-MAIN_BUILDING-1';

    database.exec({
      sql: `
        INSERT INTO
          quests (quest_id, completed_at, collected_at, village_id)
        VALUES
          ($questId, $completedAt, NULL, $village_id);
      `,
      bind: {
        $questId: quest.id,
        $completedAt: isCompleted ? resolvesAt : null,
        $village_id: newVillageId,
      },
    });
  }

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
  const { villageId, targetTileId, troops } = args;

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
    })),
  );

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

  // TODO: Combat
  createEvents<'troopMovementReturn'>(database, {
    villageId,
    troops,
    targetTileId: originTileId,
    originTileId: targetTileId,
    startsAt: resolvesAt,
    type: 'troopMovementReturn',
    originalMovementType: 'troopMovementAttack',
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

  // TODO: Combat
  createEvents<'troopMovementReturn'>(database, {
    villageId,
    troops,
    startsAt: resolvesAt,
    targetTileId: originTileId,
    originTileId: targetTileId,
    type: 'troopMovementReturn',
    originalMovementType: 'troopMovementRaid',
  });

  const targetVillageIds = database.selectValues({
    sql: selectPlayerVillageIdByTileIdQuery,
    bind: { $tile_id: targetTileId, $player_id: PLAYER_ID },
    schema: z.number(),
  });

  return { affectedVillageIds: [villageId, ...targetVillageIds] };
};
