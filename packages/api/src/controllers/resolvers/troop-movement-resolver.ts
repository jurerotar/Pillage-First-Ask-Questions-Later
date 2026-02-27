import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { newVillageQuestsFactory } from '@pillage-first/game-assets/quests';
import { buildingFieldsFactory } from '@pillage-first/game-assets/village';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { playableTribeSchema } from '@pillage-first/types/models/tribe';
import type { Resolver } from '../../types/resolver';
import { updateHeroEffectsVillageIdQuery } from '../../utils/queries/effect-queries';
import { addTroops } from '../../utils/queries/troop-queries';
import { updateVillageResourcesAt } from '../../utils/village.ts';
import { createEvents } from '../utils/create-event';
import { onHeroDeath } from './utils/hero.ts';
import { assessAdventureCountQuestCompletion } from './utils/quests.ts';

export const adventureMovementResolver: Resolver<
  GameEvent<'troopMovementAdventure'>
> = (database, args) => {
  const { villageId, startsAt, duration, resolvesAt } = args;

  const { heroId, health } = database.selectObject({
    sql: `
      UPDATE heroes
      SET
        health = MAX(0, health - MAX(0, 5 - damage_reduction)),
        experience = experience + CASE
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
            id = $villageId
          )
      RETURNING
        id AS heroId,
        health
    `,
    bind: {
      $villageId: villageId,
    },
    schema: z.strictObject({
      heroId: z.number(),
      health: z.number(),
    }),
  })!;

  if (health === 0) {
    onHeroDeath(database, resolvesAt);

    database.exec({
      sql: 'UPDATE hero_adventures SET available = available - 1 WHERE hero_id = $heroId;',
      bind: {
        $heroId: heroId,
      },
    });

    return;
  }

  database.exec({
    sql: 'UPDATE hero_adventures SET completed = completed + 1, available = available - 1 WHERE hero_id = $heroId;',
    bind: {
      $heroId: heroId,
    },
  });

  assessAdventureCountQuestCompletion(database, startsAt + duration);

  createEvents<'troopMovementReturn'>(database, {
    ...args,
    targetId: villageId,
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
  const { targetId, resolvesAt } = args;

  // targetId here represents a tile_id where the new village will be founded
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
        t.id = $tileId
        AND p.id = $playerId;
    `,
    bind: {
      $tileId: targetId,
      $playerId: PLAYER_ID,
    },
    schema: z.strictObject({
      resourceFieldComposition: resourceFieldCompositionSchema,
      tribe: playableTribeSchema,
    }),
  })!;

  // Create village with incremental slug v-{n}
  const { newVillageId } = database.selectObject({
    sql: `
      WITH
        next_slug AS (
          SELECT 'v-' || (COUNT(*) + 1) AS slug
          FROM
            villages
          WHERE
            player_id = $playerId
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
        $tileId,
        $playerId
          RETURNING id AS newVillageId;
    `,
    bind: {
      $name: 'New village',
      $tileId: targetId,
      $playerId: PLAYER_ID,
    },
    schema: z.strictObject({ newVillageId: z.number() }),
  })!;

  const buildingIdRows = database.selectObjects({
    sql: 'SELECT id, building FROM building_ids',
    schema: z.strictObject({ id: z.number(), building: z.string() }),
  });

  const buildingIdMap = new Map<string, number>(
    buildingIdRows.map((b) => [b.building, b.id]),
  );

  const buildingFields = buildingFieldsFactory(
    'player',
    tribe,
    resourceFieldComposition,
  );

  for (const { field_id, building_id, level } of buildingFields) {
    database.exec({
      sql: `
        INSERT INTO
          building_fields (village_id, field_id, building_id, level)
        VALUES
          ($villageId, $fieldId, $buildingId, $level);
      `,
      bind: {
        $villageId: newVillageId,
        $fieldId: field_id,
        $buildingId: buildingIdMap.get(building_id)!,
        $level: level,
      },
    });
  }

  // Initialize resource site for the new village (fresh-settlement baseline similar to starting village)
  database.exec({
    sql: `
      INSERT INTO resource_sites (tile_id, wood, clay, iron, wheat, updated_at)
      VALUES ($tileId, 750, 750, 750, 750, $updatedAt)
      ON CONFLICT(tile_id) DO NOTHING;
    `,
    bind: { $tileId: targetId, $updatedAt: resolvesAt },
  });

  const quests = newVillageQuestsFactory(newVillageId, tribe);

  for (const quest of quests) {
    database.exec({
      sql: `
        INSERT INTO quests (quest_id, completed_at, collected_at, village_id)
        VALUES ($questId, NULL, NULL, $villageId);
      `,
      bind: {
        $questId: quest.id,
        $villageId: newVillageId,
      },
    });
  }
};

export const returnMovementResolver: Resolver<
  GameEvent<'troopMovementReturn'>
> = (database, args) => {
  const { targetId, troops } = args;

  const { tileId: targetTileId } = database.selectObject({
    sql: 'SELECT tile_id AS tileId FROM villages WHERE id = $targetId;',
    bind: { $targetId: targetId },
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
  const { targetId, troops, resolvesAt, villageId } = args;

  const { tileId: targetTileId } = database.selectObject({
    sql: 'SELECT tile_id AS tileId FROM villages WHERE id = $targetId;',
    bind: { $targetId: targetId },
    schema: z.strictObject({ tileId: z.number() }),
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
    updateVillageResourcesAt(database, targetId, resolvesAt);

    database.exec({
      sql: updateHeroEffectsVillageIdQuery,
      bind: {
        $playerId: PLAYER_ID,
        $targetId: targetId,
      },
    });

    database.exec({
      sql: 'UPDATE heroes SET village_id = $targetId WHERE player_id = $playerId;',
      bind: {
        $playerId: PLAYER_ID,
        $targetId: targetId,
      },
    });
  }
};

export const reinforcementMovementResolver: Resolver<
  GameEvent<'troopMovementReinforcements'>
> = (database, args) => {
  const { targetId, troops } = args;

  const { tileId: targetTileId } = database.selectObject({
    sql: 'SELECT tile_id AS tileId FROM villages WHERE id = $targetId;',
    bind: { $targetId: targetId },
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
  // TODO: Combat
  createEvents<'troopMovementReturn'>(database, {
    ...args,
    type: 'troopMovementReturn',
    originalMovementType: 'attack',
  });
};

export const raidMovementResolver: Resolver<GameEvent<'troopMovementRaid'>> = (
  database,
  args,
) => {
  // TODO: Combat
  createEvents<'troopMovementReturn'>(database, {
    ...args,
    type: 'troopMovementReturn',
    originalMovementType: 'raid',
  });
};
