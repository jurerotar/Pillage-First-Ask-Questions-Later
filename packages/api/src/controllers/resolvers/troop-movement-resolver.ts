import { z } from 'zod';
import { buildingMap } from '@pillage-first/game-assets/buildings';
import { newVillageUnitResearchFactory } from '@pillage-first/game-assets/factories/unit-research';
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
import type { Resolver } from '../../types/resolver';
import { updateHeroEffectsVillageIdQuery } from '../../utils/queries/effect-queries';
import { updateVillageResourcesAt } from '../../utils/village';
import { createEvents } from '../utils/create-event';
import { onHeroDeath } from './utils/hero';
import { assessAdventureCountQuestCompletion } from './utils/quests';
import { addTroops } from './utils/troops';

export const adventureMovementResolver: Resolver<
  GameEvent<'troopMovementAdventure'>
> = (database, args) => {
  const { villageId, resolvesAt } = args;

  const { heroId, health } = database.selectObject({
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
      WHERE
        player_id = (
          SELECT player_id
          FROM
            villages
          WHERE
            id = $village_id
          )
      RETURNING
        id AS heroId,
        health
    `,
    bind: {
      $village_id: villageId,
    },
    schema: z.strictObject({
      heroId: z.number(),
      health: z.number(),
    }),
  })!;

  if (health === 0) {
    onHeroDeath(database, resolvesAt);

    database.exec({
      sql: 'UPDATE hero_adventures SET available = available - 1 WHERE hero_id = $hero_id;',
      bind: {
        $hero_id: heroId,
      },
    });

    return;
  }

  database.exec({
    sql: 'UPDATE hero_adventures SET completed = completed + 1, available = available - 1 WHERE hero_id = $hero_id;',
    bind: {
      $hero_id: heroId,
    },
  });

  assessAdventureCountQuestCompletion(database, resolvesAt);

  const { x, y } = database.selectObject({
    sql: 'SELECT x, y FROM tiles t JOIN villages v ON v.tile_id = t.id WHERE v.id = $village_id;',
    bind: { $village_id: villageId },
    schema: z.strictObject({ x: z.number(), y: z.number() }),
  })!;

  createEvents<'troopMovementReturn'>(database, {
    ...args,
    startsAt: resolvesAt,
    targetCoordinates: { x, y },
    type: 'troopMovementReturn',
    originalMovementType: 'adventure',
  });
};

export const oasisOccupationMovementResolver: Resolver<
  GameEvent<'troopMovementOasisOccupation'>
> = (_database, _args) => {};

export const findNewVillageMovementResolver: Resolver<
  GameEvent<'troopMovementFindNewVillage'>
> = (database, args) => {
  const {
    targetCoordinates: { x, y },
    resolvesAt,
    villageId,
  } = args;

  const { id: tileId } = database.selectObject({
    sql: 'SELECT id FROM tiles WHERE x = $x AND y = $y;',
    bind: { $x: x, $y: y },
    schema: z.strictObject({ id: z.number() }),
  })!;

  // tileId here represents a tile_id where the new village will be founded
  const { resourceFieldComposition, tribe } = database.selectObject({
    sql: `
      SELECT
        rfc.resource_field_composition AS resourceFieldComposition,
        ti.tribe
      FROM
        tiles t
          JOIN resource_field_composition_ids rfc ON t.resource_field_composition_id = rfc.id
          CROSS JOIN players p
          JOIN tribe_ids ti ON p.tribe_id = ti.id
      WHERE
        t.id = $tile_id
        AND p.id = $player_id;
    `,
    bind: {
      $tile_id: tileId,
      $player_id: PLAYER_ID,
    },
    schema: z.strictObject({
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
    sql: "SELECT id FROM effect_ids WHERE effect = 'wheatProduction';",
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
        sql: `
          INSERT INTO
            effects (effect_id, value, type, scope, source, village_id, source_specifier)
          VALUES
            ((
               SELECT id
               FROM effect_ids
               WHERE effect = $effectName
               ), $value, $type, 'village', 'building', $villageId, $field_id);
        `,
        bind: {
          $effectName: effect.effectId,
          $value: effect.valuesPerLevel[level],
          $type: effect.type,
          $villageId: newVillageId,
          $field_id: field_id,
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

  const [tier1UnitId, settlerUnitId] = newVillageUnitResearchFactory(tribe);

  database.exec({
    sql: `
      INSERT INTO
        unit_research (village_id, unit_id)
      SELECT
        $village_id,
        u.id
      FROM
        unit_ids u
      WHERE
        u.unit IN ($tier1Unit, $settlerUnit);
    `,
    bind: {
      $village_id: newVillageId,
      $tier1Unit: tier1UnitId,
      $settlerUnit: settlerUnitId,
    },
  });

  // Population effect
  database.exec({
    sql: `
      INSERT INTO
        effects (effect_id, value, type, scope, source, village_id, source_specifier)
      VALUES
        ($effectId, $value, 'base', 'village', 'building', $villageId, 0);
    `,
    bind: {
      $effectId: wheatProductionEffectId,
      $value: -3,
      $villageId: newVillageId,
    },
  });

  // Troop wheat consumption effect
  database.exec({
    sql: `
      INSERT INTO
        effects (effect_id, value, type, scope, source, village_id, source_specifier)
      VALUES
        ($effectId, $value, 'base', 'village', 'troops', $villageId, 0);
    `,
    bind: {
      $effectId: wheatProductionEffectId,
      $value: 0,
      $villageId: newVillageId,
    },
  });

  // Reduce troop consumption in the source village by 3 (since 3 settlers are consumed)
  database.exec({
    sql: `
      UPDATE effects
      SET
        value = value - 3
      WHERE
        effect_id = $effectId
        AND source = 'troops'
        AND village_id = $villageId;
    `,
    bind: {
      $effectId: wheatProductionEffectId,
      $villageId: villageId,
    },
  });

  updateVillageResourcesAt(database, villageId, resolvesAt);
};

export const returnMovementResolver: Resolver<
  GameEvent<'troopMovementReturn'>
> = (database, args) => {
  const {
    targetCoordinates: { x, y },
    troops,
  } = args;

  const { tileId: targetTileId } = database.selectObject({
    sql: 'SELECT id AS tileId FROM tiles WHERE x = $x AND y = $y;',
    bind: { $x: x, $y: y },
    schema: z.strictObject({ tileId: z.number() }),
  })!;

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
    })),
  );
};

export const relocationMovementResolver: Resolver<
  GameEvent<'troopMovementRelocation'>
> = (database, args) => {
  const {
    targetCoordinates: { x, y },
    troops,
    resolvesAt,
    villageId,
  } = args;

  const { tileId: targetTileId, villageId: targetVillageId } =
    database.selectObject({
      sql: `
        SELECT
          t.id AS tileId,
          v.id AS villageId
        FROM
          tiles t
            JOIN villages v ON v.tile_id = t.id
        WHERE
          t.x = $x
          AND t.y = $y;
      `,
      bind: { $x: x, $y: y },
      schema: z.strictObject({ tileId: z.number(), villageId: z.number() }),
    })!;

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
      source: targetTileId,
    })),
  );

  // If hero is relocated, update effects as well
  if (troops.some(({ unitId }) => unitId === 'HERO')) {
    // Update resources in both villages, due to effects changing
    updateVillageResourcesAt(database, villageId, resolvesAt);
    updateVillageResourcesAt(database, targetVillageId, resolvesAt);

    database.exec({
      sql: updateHeroEffectsVillageIdQuery,
      bind: {
        $player_id: PLAYER_ID,
        $targetId: targetVillageId,
      },
    });

    database.exec({
      sql: 'UPDATE heroes SET village_id = $targetId WHERE player_id = $player_id;',
      bind: {
        $player_id: PLAYER_ID,
        $targetId: targetVillageId,
      },
    });
  }
};

export const reinforcementMovementResolver: Resolver<
  GameEvent<'troopMovementReinforcements'>
> = (database, args) => {
  const {
    targetCoordinates: { x, y },
    troops,
  } = args;

  const { tileId: targetTileId } = database.selectObject({
    sql: 'SELECT id AS tileId FROM tiles WHERE x = $x AND y = $y;',
    bind: { $x: x, $y: y },
    schema: z.strictObject({ tileId: z.number() }),
  })!;

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
    })),
  );
};

export const attackMovementResolver: Resolver<
  GameEvent<'troopMovementAttack'>
> = (database, args) => {
  const { villageId, resolvesAt } = args;

  const { x, y } = database.selectObject({
    sql: 'SELECT x, y FROM tiles t JOIN villages v ON v.tile_id = t.id WHERE v.id = $village_id;',
    bind: { $village_id: villageId },
    schema: z.strictObject({ x: z.number(), y: z.number() }),
  })!;

  // TODO: Combat
  createEvents<'troopMovementReturn'>(database, {
    ...args,
    startsAt: resolvesAt,
    targetCoordinates: { x, y },
    type: 'troopMovementReturn',
    originalMovementType: 'attack',
  });
};

export const raidMovementResolver: Resolver<GameEvent<'troopMovementRaid'>> = (
  database,
  args,
) => {
  const { villageId, resolvesAt } = args;

  const { x, y } = database.selectObject({
    sql: 'SELECT x, y FROM tiles t JOIN villages v ON v.tile_id = t.id WHERE v.id = $village_id;',
    bind: { $village_id: villageId },
    schema: z.strictObject({ x: z.number(), y: z.number() }),
  })!;

  // TODO: Combat
  createEvents<'troopMovementReturn'>(database, {
    ...args,
    startsAt: resolvesAt,
    targetCoordinates: { x, y },
    type: 'troopMovementReturn',
    originalMovementType: 'raid',
  });
};
