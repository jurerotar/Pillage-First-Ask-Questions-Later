import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  getMe,
  getPlayerBySlug,
  getPlayerVillageListing,
  getPlayerVillagesWithPopulation,
  getSentReinforcementsByVillage,
  getTroopsByVillage,
  relocateReinforcements,
  relocateSentReinforcements,
  renameVillage,
  returnReinforcements,
  returnSentReinforcements,
} from '../player-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('player-controllers', () => {
  const playerId = PLAYER_ID;

  const getTroopWheatProductionEffectValue = (
    database: DbFacade,
    villageId: number,
  ) =>
    database.selectValue({
      sql: `
        SELECT e.value
        FROM effects e
          JOIN effect_ids ei ON e.effect_id = ei.id
        WHERE
          e.village_id = $village_id
          AND e.source = 'troops'
          AND ei.effect = 'wheatProduction';
      `,
      bind: { $village_id: villageId },
      schema: z.number(),
    })!;

  const setTroopWheatProductionEffectValue = (
    database: DbFacade,
    villageId: number,
    value: number,
  ) => {
    database.exec({
      sql: `
        DELETE
        FROM effects
        WHERE
          village_id = $village_id
          AND source = 'troops'
          AND effect_id = (
            SELECT id
            FROM effect_ids
            WHERE effect = 'wheatProduction'
          );
      `,
      bind: { $village_id: villageId },
    });

    database.exec({
      sql: `
        INSERT INTO effects (effect_id, value, type, scope, source, village_id, source_specifier)
        SELECT id, $value, 'base', 'village', 'troops', $village_id, NULL
        FROM effect_ids
        WHERE effect = 'wheatProduction';
      `,
      bind: { $village_id: villageId, $value: value },
    });
  };

  test('getMe should return current player details', async () => {
    const database = await prepareTestDatabase();

    getMe(database, createControllerArgs<'/players/me'>({}));

    expect(true).toBe(true);
  });

  test('getPlayerVillageListing should return village listing for a player', async () => {
    const database = await prepareTestDatabase();

    const result = getPlayerVillageListing(
      database,
      createControllerArgs<'/players/:playerId/villages'>({
        path: { playerId },
      }),
    );

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('tileId');
    expect(result[0]).toHaveProperty('coordinates');
    expect(result[0].coordinates).toHaveProperty('x');
    expect(result[0].coordinates).toHaveProperty('y');
    expect(result[0]).toHaveProperty('resourceFieldComposition');
  });

  test('getPlayerVillagesWithPopulation should return correct population (only counting building base effects)', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id, player_id FROM villages WHERE player_id = $player_id LIMIT 1',
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number(), player_id: z.number() }),
    })!;

    const wheatEffectId = database.selectValue({
      sql: "SELECT id FROM effect_ids WHERE effect = 'wheatProduction'",
      schema: z.number(),
    })!;

    // Clear existing effects for this village
    database.exec({
      sql: 'DELETE FROM effects WHERE village_id = $village_id',
      bind: { $village_id: village.id },
    });

    // Seed various effects
    const effects = [
      {
        value: -400,
        type: 'base',
        scope: 'village',
        source: 'building',
        source_specifier: 0,
      },
      {
        value: 150,
        type: 'base',
        scope: 'village',
        source: 'troops',
        source_specifier: null,
      },
    ];

    for (const effect of effects) {
      database.exec({
        sql: `
          INSERT INTO effects (effect_id, value, type, scope, source, village_id, source_specifier)
          VALUES ($effect_id, $value, $type, $scope, $source, $village_id, $source_specifier)
        `,
        bind: {
          $effect_id: wheatEffectId,
          $value: effect.value,
          $type: effect.type,
          $scope: effect.scope,
          $source: effect.source,
          $village_id: village.id,
          $source_specifier: effect.source_specifier,
        },
      });
    }

    const result = getPlayerVillagesWithPopulation(
      database,
      createControllerArgs<'/players/:playerId/villages-with-population'>({
        path: { playerId: village.player_id },
      }),
    );

    const testVillage = result.find((v) => v.id === village.id)!;

    expect(testVillage.population).toBe(400);
  });

  test('getTroopsByVillage should return troops by village for a player', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages WHERE player_id = $player_id LIMIT 1',
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number() }),
    })!;

    getTroopsByVillage(
      database,
      createControllerArgs<'/villages/:villageId/troops'>({
        path: { villageId: village.id },
      }),
    );

    expect(true).toBe(true);
  });

  test('getSentReinforcementsByVillage should group current village reinforcements by stationed village', async () => {
    const database = await prepareTestDatabase();

    const sourceVillage = database.selectObject({
      sql: `
        SELECT id, tile_id
        FROM villages
        WHERE player_id = $player_id
        ORDER BY id
        LIMIT 1
      `,
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    const targetTileId = database.selectValue({
      sql: `
        SELECT id
        FROM tiles
        WHERE id != $source_tile_id
          AND id NOT IN (SELECT tile_id FROM villages)
        ORDER BY id
        LIMIT 1
      `,
      bind: { $source_tile_id: sourceVillage.tile_id },
      schema: z.number(),
    })!;

    database.selectValue({
      sql: `
        INSERT INTO villages (name, slug, tile_id, player_id)
        VALUES ($name, $slug, $tile_id, $player_id)
        RETURNING id
      `,
      bind: {
        $name: 'Stationed Target Village',
        $slug: `stationed-target-${Date.now()}`,
        $tile_id: targetTileId,
        $player_id: playerId,
      },
      schema: z.number(),
    })!;

    database.exec({
      sql: `
        INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
        VALUES
          ($tile_id, $source_tile_id, (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 5),
          ($tile_id, $source_tile_id, (SELECT id FROM unit_ids WHERE unit = 'PRAETORIAN'), 2)
      `,
      bind: {
        $tile_id: targetTileId,
        $source_tile_id: sourceVillage.tile_id,
      },
    });

    const result = getSentReinforcementsByVillage(
      database,
      createControllerArgs<'/villages/:villageId/sent-reinforcements'>({
        path: { villageId: sourceVillage.id },
      }),
    );

    expect(result).toHaveLength(1);
    expect(result[0].village.tileId).toBe(targetTileId);
    expect(result[0].troops).toHaveLength(2);
    expect(result[0].troops.map(({ unitId }) => unitId).sort()).toEqual([
      'LEGIONNAIRE',
      'PRAETORIAN',
    ]);
  });

  test('renameVillage should rename a village', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages WHERE player_id = $player_id LIMIT 1',
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number() }),
    })!;

    renameVillage(
      database,
      createControllerArgs<'/villages/:villageId', 'patch'>({
        path: { villageId: village.id },
        body: { name: 'New Village Name' },
      }),
    );

    expect(true).toBe(true);
  });

  test('relocateReinforcements should properly relocate troops from source reinforcement to village troops', async () => {
    const database = await prepareTestDatabase();

    const targetVillage = database.selectObject({
      sql: `
        SELECT id, tile_id
        FROM villages
        WHERE player_id = $player_id
        ORDER BY id
        LIMIT 1
      `,
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    const sourceTileId = database.selectValue({
      sql: `
        SELECT id
        FROM tiles
        WHERE id != $target_tile_id
          AND id NOT IN (SELECT tile_id FROM villages)
        ORDER BY id
        LIMIT 1
      `,
      bind: { $target_tile_id: targetVillage.tile_id },
      schema: z.number(),
    })!;

    const sourceVillageId = database.selectValue({
      sql: `
        INSERT INTO villages (name, slug, tile_id, player_id)
        VALUES ($name, $slug, $tile_id, $player_id)
        RETURNING id
      `,
      bind: {
        $name: 'Relocation Source Village',
        $slug: `relocation-source-${Date.now()}`,
        $tile_id: sourceTileId,
        $player_id: playerId,
      },
      schema: z.number(),
    })!;

    database.exec({
      sql: `
        INSERT INTO resource_sites (tile_id, wood, clay, iron, wheat, updated_at)
        VALUES
          ($target_tile_id, 750, 750, 750, 750, $updated_at),
          ($source_tile_id, 750, 750, 750, 750, $updated_at)
        ON CONFLICT(tile_id) DO NOTHING
      `,
      bind: {
        $target_tile_id: targetVillage.tile_id,
        $source_tile_id: sourceTileId,
        $updated_at: Date.now(),
      },
    });

    database.exec({
      sql: `
        INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
        VALUES (
          $tile_id,
          $source_tile_id,
          (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'),
          $amount
        )
      `,
      bind: {
        $tile_id: targetVillage.tile_id,
        $source_tile_id: sourceTileId,
        $amount: 10,
      },
    });

    relocateReinforcements(
      database,
      createControllerArgs<
        '/villages/:villageId/relocate-reinforcements',
        'post'
      >({
        path: { villageId: targetVillage.id },
        body: {
          sourceTileId,
          troops: [{ unitId: 'LEGIONNAIRE', amount: 4 }],
        },
      }),
    );

    const sourceReinforcementAmount = database.selectValue({
      sql: `
        SELECT t.amount
        FROM troops t
          JOIN unit_ids ui ON ui.id = t.unit_id
        WHERE
          t.tile_id = $tile_id
          AND t.source_tile_id = $source_tile_id
          AND ui.unit = 'LEGIONNAIRE'
      `,
      bind: {
        $tile_id: targetVillage.tile_id,
        $source_tile_id: sourceTileId,
      },
      schema: z.number().nullable(),
    });

    const villageTroopsAmount = database.selectValue({
      sql: `
        SELECT t.amount
        FROM troops t
          JOIN unit_ids ui ON ui.id = t.unit_id
        WHERE
          t.tile_id = $tile_id
          AND t.source_tile_id = $source_tile_id
          AND ui.unit = 'LEGIONNAIRE'
      `,
      bind: {
        $tile_id: targetVillage.tile_id,
        $source_tile_id: targetVillage.tile_id,
      },
      schema: z.number().nullable(),
    });

    expect(sourceReinforcementAmount).toBe(6);
    expect(villageTroopsAmount).toBe(4);
    expect(sourceVillageId).toBeGreaterThan(0);
  });

  test('relocateReinforcements should delete the reinforcement row when moving the full remaining amount', async () => {
    const database = await prepareTestDatabase();

    const targetVillage = database.selectObject({
      sql: `
        SELECT id, tile_id
        FROM villages
        WHERE player_id = $player_id
        ORDER BY id
        LIMIT 1
      `,
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    const sourceTileId = database.selectValue({
      sql: `
        SELECT id
        FROM tiles
        WHERE id != $target_tile_id
          AND id NOT IN (SELECT tile_id FROM villages)
        ORDER BY id
        LIMIT 1
      `,
      bind: { $target_tile_id: targetVillage.tile_id },
      schema: z.number(),
    })!;

    database.selectValue({
      sql: `
        INSERT INTO villages (name, slug, tile_id, player_id)
        VALUES ($name, $slug, $tile_id, $player_id)
        RETURNING id
      `,
      bind: {
        $name: 'Exact Relocation Source Village',
        $slug: `exact-relocation-source-${Date.now()}`,
        $tile_id: sourceTileId,
        $player_id: playerId,
      },
      schema: z.number(),
    })!;

    database.exec({
      sql: `
        INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
        VALUES (
          $tile_id,
          $source_tile_id,
          (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'),
          $amount
        )
      `,
      bind: {
        $tile_id: targetVillage.tile_id,
        $source_tile_id: sourceTileId,
        $amount: 3,
      },
    });

    relocateReinforcements(
      database,
      createControllerArgs<
        '/villages/:villageId/relocate-reinforcements',
        'post'
      >({
        path: { villageId: targetVillage.id },
        body: {
          sourceTileId,
          troops: [{ unitId: 'LEGIONNAIRE', amount: 3 }],
        },
      }),
    );

    const sourceReinforcementCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM troops t
          JOIN unit_ids ui ON ui.id = t.unit_id
        WHERE
          t.tile_id = $tile_id
          AND t.source_tile_id = $source_tile_id
          AND ui.unit = 'LEGIONNAIRE'
      `,
      bind: {
        $tile_id: targetVillage.tile_id,
        $source_tile_id: sourceTileId,
      },
      schema: z.number(),
    });

    const villageTroopsAmount = database.selectValue({
      sql: `
        SELECT t.amount
        FROM troops t
          JOIN unit_ids ui ON ui.id = t.unit_id
        WHERE
          t.tile_id = $tile_id
          AND t.source_tile_id = $source_tile_id
          AND ui.unit = 'LEGIONNAIRE'
      `,
      bind: {
        $tile_id: targetVillage.tile_id,
        $source_tile_id: targetVillage.tile_id,
      },
      schema: z.number().nullable(),
    });

    expect(sourceReinforcementCount).toBe(0);
    expect(villageTroopsAmount).toBe(3);
  });

  test('returnReinforcements should create return event and remove troops from reinforcements', async () => {
    const database = await prepareTestDatabase();

    const targetVillage = database.selectObject({
      sql: `
        SELECT id, tile_id
        FROM villages
        WHERE player_id = $player_id
        ORDER BY id
        LIMIT 1
      `,
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    const sourceTileId = database.selectValue({
      sql: `
        SELECT id
        FROM tiles
        WHERE id != $target_tile_id
          AND id NOT IN (SELECT tile_id FROM villages)
        ORDER BY id
        LIMIT 1
      `,
      bind: { $target_tile_id: targetVillage.tile_id },
      schema: z.number(),
    })!;

    const sourceVillageId = database.selectValue({
      sql: `
        INSERT INTO villages (name, slug, tile_id, player_id)
        VALUES ($name, $slug, $tile_id, $player_id)
        RETURNING id
      `,
      bind: {
        $name: 'Return Source Village',
        $slug: `return-source-${Date.now()}`,
        $tile_id: sourceTileId,
        $player_id: playerId,
      },
      schema: z.number(),
    })!;

    database.exec({
      sql: `
        INSERT INTO resource_sites (tile_id, wood, clay, iron, wheat, updated_at)
        VALUES ($tile_id, 750, 750, 750, 750, $updated_at)
        ON CONFLICT(tile_id) DO NOTHING
      `,
      bind: {
        $tile_id: sourceTileId,
        $updated_at: Date.now(),
      },
    });

    database.exec({
      sql: `
        INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
        VALUES (
          $tile_id,
          $source_tile_id,
          (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'),
          $amount
        )
      `,
      bind: {
        $tile_id: targetVillage.tile_id,
        $source_tile_id: sourceTileId,
        $amount: 10,
      },
    });

    setTroopWheatProductionEffectValue(database, targetVillage.id, 10);
    setTroopWheatProductionEffectValue(database, sourceVillageId, 2);

    const targetTroopWheatEffectBefore = getTroopWheatProductionEffectValue(
      database,
      targetVillage.id,
    );
    const sourceTroopWheatEffectBefore = getTroopWheatProductionEffectValue(
      database,
      sourceVillageId,
    );

    returnReinforcements(
      database,
      createControllerArgs<
        '/villages/:villageId/return-reinforcements',
        'post'
      >({
        path: { villageId: targetVillage.id },
        body: {
          sourceTileId,
          troops: [{ unitId: 'LEGIONNAIRE', amount: 4 }],
        },
      }),
    );

    const sourceReinforcementAmount = database.selectValue({
      sql: `
        SELECT t.amount
        FROM troops t
          JOIN unit_ids ui ON ui.id = t.unit_id
        WHERE
          t.tile_id = $tile_id
          AND t.source_tile_id = $source_tile_id
          AND ui.unit = 'LEGIONNAIRE'
      `,
      bind: {
        $tile_id: targetVillage.tile_id,
        $source_tile_id: sourceTileId,
      },
      schema: z.number().nullable(),
    });

    const returnEvent = database.selectObject({
      sql: `
        SELECT
          type,
          JSON_EXTRACT(meta, '$.troops[0].unitId') AS unit_id,
          JSON_EXTRACT(meta, '$.troops[0].amount') AS amount,
          JSON_EXTRACT(meta, '$.originCoordinates.x') AS origin_x,
          JSON_EXTRACT(meta, '$.targetCoordinates.x') AS target_x,
          JSON_EXTRACT(meta, '$.originalMovementType') AS original_movement_type
        FROM events
        WHERE type = 'troopMovementReturn'
        ORDER BY id DESC
        LIMIT 1
      `,
      schema: z.strictObject({
        type: z.string(),
        unit_id: z.string(),
        amount: z.number(),
        origin_x: z.number(),
        target_x: z.number(),
        original_movement_type: z.string(),
      }),
    })!;

    expect(sourceReinforcementAmount).toBe(6);
    expect(getTroopWheatProductionEffectValue(database, targetVillage.id)).toBe(
      targetTroopWheatEffectBefore - 4,
    );
    expect(getTroopWheatProductionEffectValue(database, sourceVillageId)).toBe(
      sourceTroopWheatEffectBefore + 4,
    );
    expect(returnEvent).not.toBeNull();
    expect(returnEvent.type).toBe('troopMovementReturn');
    expect(returnEvent.unit_id).toBe('LEGIONNAIRE');
    expect(returnEvent.amount).toBe(4);
    expect(returnEvent.origin_x).not.toBe(returnEvent.target_x);
    expect(returnEvent.original_movement_type).toBe(
      'troopMovementReturnReinforcements',
    );
  });

  test('returnReinforcements should delete the reinforcement row when returning the full remaining amount', async () => {
    const database = await prepareTestDatabase();

    const targetVillage = database.selectObject({
      sql: `
        SELECT id, tile_id
        FROM villages
        WHERE player_id = $player_id
        ORDER BY id
        LIMIT 1
      `,
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    const sourceTileId = database.selectValue({
      sql: `
        SELECT id
        FROM tiles
        WHERE id != $target_tile_id
          AND id NOT IN (SELECT tile_id FROM villages)
        ORDER BY id
        LIMIT 1
      `,
      bind: { $target_tile_id: targetVillage.tile_id },
      schema: z.number(),
    })!;

    database.selectValue({
      sql: `
        INSERT INTO villages (name, slug, tile_id, player_id)
        VALUES ($name, $slug, $tile_id, $player_id)
        RETURNING id
      `,
      bind: {
        $name: 'Exact Return Source Village',
        $slug: `exact-return-source-${Date.now()}`,
        $tile_id: sourceTileId,
        $player_id: playerId,
      },
      schema: z.number(),
    })!;

    database.exec({
      sql: `
        INSERT INTO resource_sites (tile_id, wood, clay, iron, wheat, updated_at)
        VALUES ($tile_id, 750, 750, 750, 750, $updated_at)
        ON CONFLICT(tile_id) DO NOTHING
      `,
      bind: {
        $tile_id: sourceTileId,
        $updated_at: Date.now(),
      },
    });

    database.exec({
      sql: `
        INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
        VALUES (
          $tile_id,
          $source_tile_id,
          (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'),
          $amount
        )
      `,
      bind: {
        $tile_id: targetVillage.tile_id,
        $source_tile_id: sourceTileId,
        $amount: 3,
      },
    });

    returnReinforcements(
      database,
      createControllerArgs<
        '/villages/:villageId/return-reinforcements',
        'post'
      >({
        path: { villageId: targetVillage.id },
        body: {
          sourceTileId,
          troops: [{ unitId: 'LEGIONNAIRE', amount: 3 }],
        },
      }),
    );

    const sourceReinforcementCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM troops t
          JOIN unit_ids ui ON ui.id = t.unit_id
        WHERE
          t.tile_id = $tile_id
          AND t.source_tile_id = $source_tile_id
          AND ui.unit = 'LEGIONNAIRE'
      `,
      bind: {
        $tile_id: targetVillage.tile_id,
        $source_tile_id: sourceTileId,
      },
      schema: z.number(),
    });

    const returnEvent = database.selectObject({
      sql: `
        SELECT
          type,
          JSON_EXTRACT(meta, '$.troops[0].unitId') AS unit_id,
          JSON_EXTRACT(meta, '$.troops[0].amount') AS amount
        FROM events
        WHERE type = 'troopMovementReturn'
        ORDER BY id DESC
        LIMIT 1
      `,
      schema: z.strictObject({
        type: z.string(),
        unit_id: z.string(),
        amount: z.number(),
      }),
    })!;

    expect(sourceReinforcementCount).toBe(0);
    expect(returnEvent.type).toBe('troopMovementReturn');
    expect(returnEvent.unit_id).toBe('LEGIONNAIRE');
    expect(returnEvent.amount).toBe(3);
  });

  test('returnReinforcements should reject more troops than are stationed', async () => {
    const database = await prepareTestDatabase();

    const targetVillage = database.selectObject({
      sql: `
        SELECT id, tile_id
        FROM villages
        WHERE player_id = $player_id
        ORDER BY id
        LIMIT 1
      `,
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    const sourceTileId = database.selectValue({
      sql: `
        SELECT id
        FROM tiles
        WHERE id != $target_tile_id
          AND id NOT IN (SELECT tile_id FROM villages)
        ORDER BY id
        LIMIT 1
      `,
      bind: { $target_tile_id: targetVillage.tile_id },
      schema: z.number(),
    })!;

    database.selectValue({
      sql: `
        INSERT INTO villages (name, slug, tile_id, player_id)
        VALUES ($name, $slug, $tile_id, $player_id)
        RETURNING id
      `,
      bind: {
        $name: 'Over Return Source Village',
        $slug: `over-return-source-${Date.now()}`,
        $tile_id: sourceTileId,
        $player_id: playerId,
      },
      schema: z.number(),
    })!;

    database.exec({
      sql: `
        INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
        VALUES (
          $tile_id,
          $source_tile_id,
          (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'),
          3
        )
      `,
      bind: {
        $tile_id: targetVillage.tile_id,
        $source_tile_id: sourceTileId,
      },
    });

    expect(() =>
      returnReinforcements(
        database,
        createControllerArgs<
          '/villages/:villageId/return-reinforcements',
          'post'
        >({
          path: { villageId: targetVillage.id },
          body: {
            sourceTileId,
            troops: [{ unitId: 'LEGIONNAIRE', amount: 4 }],
          },
        }),
      ),
    ).toThrow('Not enough troops available');
  });

  test('returnSentReinforcements should create a return event back to the current village', async () => {
    const database = await prepareTestDatabase();

    const sourceVillage = database.selectObject({
      sql: `
        SELECT id, tile_id
        FROM villages
        WHERE player_id = $player_id
        ORDER BY id
        LIMIT 1
      `,
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    const stationedTileId = database.selectValue({
      sql: `
        SELECT id
        FROM tiles
        WHERE id != $source_tile_id
          AND id NOT IN (SELECT tile_id FROM villages)
        ORDER BY id
        LIMIT 1
      `,
      bind: { $source_tile_id: sourceVillage.tile_id },
      schema: z.number(),
    })!;

    const stationedVillageId = database.selectValue({
      sql: `
        INSERT INTO villages (name, slug, tile_id, player_id)
        VALUES ($name, $slug, $tile_id, $player_id)
        RETURNING id
      `,
      bind: {
        $name: 'Remote Garrison',
        $slug: `remote-garrison-${Date.now()}`,
        $tile_id: stationedTileId,
        $player_id: playerId,
      },
      schema: z.number(),
    })!;

    database.exec({
      sql: `
        INSERT INTO resource_sites (tile_id, wood, clay, iron, wheat, updated_at)
        VALUES ($tile_id, 750, 750, 750, 750, $updated_at)
        ON CONFLICT(tile_id) DO NOTHING
      `,
      bind: {
        $tile_id: stationedTileId,
        $updated_at: Date.now(),
      },
    });

    database.exec({
      sql: `
        INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
        VALUES (
          $tile_id,
          $source_tile_id,
          (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'),
          $amount
        )
      `,
      bind: {
        $tile_id: stationedTileId,
        $source_tile_id: sourceVillage.tile_id,
        $amount: 7,
      },
    });

    setTroopWheatProductionEffectValue(database, sourceVillage.id, 3);
    setTroopWheatProductionEffectValue(database, stationedVillageId, 7);

    const sourceTroopWheatEffectBefore = getTroopWheatProductionEffectValue(
      database,
      sourceVillage.id,
    );
    const stationedTroopWheatEffectBefore = getTroopWheatProductionEffectValue(
      database,
      stationedVillageId,
    );

    returnSentReinforcements(
      database,
      createControllerArgs<
        '/villages/:villageId/return-sent-reinforcements',
        'post'
      >({
        path: { villageId: sourceVillage.id },
        body: {
          stationedTileId,
          troops: [{ unitId: 'LEGIONNAIRE', amount: 4 }],
        },
      }),
    );

    const stationedAmount = database.selectValue({
      sql: `
        SELECT t.amount
        FROM troops t
          JOIN unit_ids ui ON ui.id = t.unit_id
        WHERE
          t.tile_id = $tile_id
          AND t.source_tile_id = $source_tile_id
          AND ui.unit = 'LEGIONNAIRE'
      `,
      bind: {
        $tile_id: stationedTileId,
        $source_tile_id: sourceVillage.tile_id,
      },
      schema: z.number().nullable(),
    });

    const returnEvent = database.selectObject({
      sql: `
        SELECT
          type,
          JSON_EXTRACT(meta, '$.troops[0].unitId') AS unit_id,
          JSON_EXTRACT(meta, '$.troops[0].amount') AS amount,
          JSON_EXTRACT(meta, '$.targetCoordinates.x') AS target_x,
          JSON_EXTRACT(meta, '$.originalMovementType') AS original_movement_type
        FROM events
        WHERE type = 'troopMovementReturn'
        ORDER BY id DESC
        LIMIT 1
      `,
      schema: z.strictObject({
        type: z.string(),
        unit_id: z.string(),
        amount: z.number(),
        target_x: z.number(),
        original_movement_type: z.string(),
      }),
    })!;

    expect(stationedAmount).toBe(3);
    expect(
      getTroopWheatProductionEffectValue(database, stationedVillageId),
    ).toBe(stationedTroopWheatEffectBefore - 4);
    expect(getTroopWheatProductionEffectValue(database, sourceVillage.id)).toBe(
      sourceTroopWheatEffectBefore + 4,
    );
    expect(returnEvent.type).toBe('troopMovementReturn');
    expect(returnEvent.unit_id).toBe('LEGIONNAIRE');
    expect(returnEvent.amount).toBe(4);
    expect(returnEvent.target_x).toBeDefined();
    expect(returnEvent.original_movement_type).toBe(
      'troopMovementReturnReinforcements',
    );
  });

  test('relocateSentReinforcements should create a reinforcement movement to the new target village', async () => {
    const database = await prepareTestDatabase();

    const sourceVillage = database.selectObject({
      sql: `
        SELECT id, tile_id
        FROM villages
        WHERE player_id = $player_id
        ORDER BY id
        LIMIT 1
      `,
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    const stationedTileId = database.selectValue({
      sql: `
        SELECT id
        FROM tiles
        WHERE id != $source_tile_id
          AND id NOT IN (SELECT tile_id FROM villages)
        ORDER BY id
        LIMIT 1
      `,
      bind: { $source_tile_id: sourceVillage.tile_id },
      schema: z.number(),
    })!;

    const targetTileId = database.selectValue({
      sql: `
        SELECT id
        FROM tiles
        WHERE id NOT IN ($source_tile_id, $stationed_tile_id)
          AND id NOT IN (SELECT tile_id FROM villages)
        ORDER BY id
        LIMIT 1
      `,
      bind: {
        $source_tile_id: sourceVillage.tile_id,
        $stationed_tile_id: stationedTileId,
      },
      schema: z.number(),
    })!;

    database.exec({
      sql: `
        INSERT INTO villages (name, slug, tile_id, player_id)
        VALUES
          ($stationed_name, $stationed_slug, $stationed_tile_id, $player_id),
          ($target_name, $target_slug, $target_tile_id, $player_id)
      `,
      bind: {
        $stationed_name: 'Relocation Origin Village',
        $stationed_slug: `relocation-origin-${Date.now()}`,
        $stationed_tile_id: stationedTileId,
        $target_name: 'Relocation Destination Village',
        $target_slug: `relocation-destination-${Date.now()}`,
        $target_tile_id: targetTileId,
        $player_id: playerId,
      },
    });

    database.exec({
      sql: `
        INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
        VALUES (
          $tile_id,
          $source_tile_id,
          (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'),
          $amount
        )
      `,
      bind: {
        $tile_id: stationedTileId,
        $source_tile_id: sourceVillage.tile_id,
        $amount: 6,
      },
    });

    relocateSentReinforcements(
      database,
      createControllerArgs<
        '/villages/:villageId/relocate-sent-reinforcements',
        'post'
      >({
        path: { villageId: sourceVillage.id },
        body: {
          stationedTileId,
          troops: [{ unitId: 'LEGIONNAIRE', amount: 2 }],
        },
      }),
    );

    const stationedAmount = database.selectValue({
      sql: `
        SELECT t.amount
        FROM troops t
          JOIN unit_ids ui ON ui.id = t.unit_id
        WHERE
          t.tile_id = $tile_id
          AND t.source_tile_id = $source_tile_id
          AND ui.unit = 'LEGIONNAIRE'
      `,
      bind: {
        $tile_id: stationedTileId,
        $source_tile_id: sourceVillage.tile_id,
      },
      schema: z.number().nullable(),
    });

    const stationedVillageTroops = database.selectValue({
      sql: `
          SELECT t.amount
          FROM troops t
            JOIN unit_ids ui ON ui.id = t.unit_id
          WHERE
            t.tile_id = $tile_id
            AND t.source_tile_id = $source_tile_id
            AND ui.unit = 'LEGIONNAIRE'
        `,
      bind: {
        $tile_id: stationedTileId,
        $source_tile_id: stationedTileId,
      },
      schema: z.number().nullable(),
    })!;

    expect(stationedAmount).toBe(4);
    expect(stationedVillageTroops).toBe(2);
  });

  test('relocateReinforcements should relocate hero and update hero effects village', async () => {
    const database = await prepareTestDatabase();

    const targetVillage = database.selectObject({
      sql: `
        SELECT id, tile_id
        FROM villages
        WHERE player_id = $player_id
        ORDER BY id
        LIMIT 1
      `,
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    const sourceTileId = database.selectValue({
      sql: `
        SELECT id
        FROM tiles
        WHERE id != $target_tile_id
          AND id NOT IN (SELECT tile_id FROM villages)
        ORDER BY id
        LIMIT 1
      `,
      bind: { $target_tile_id: targetVillage.tile_id },
      schema: z.number(),
    })!;

    const sourceVillageId = database.selectValue({
      sql: `
        INSERT INTO villages (name, slug, tile_id, player_id)
        VALUES ($name, $slug, $tile_id, $player_id)
        RETURNING id
      `,
      bind: {
        $name: 'Hero Relocation Source Village',
        $slug: `hero-relocation-source-${Date.now()}`,
        $tile_id: sourceTileId,
        $player_id: playerId,
      },
      schema: z.number(),
    })!;

    database.exec({
      sql: `
        INSERT INTO resource_sites (tile_id, wood, clay, iron, wheat, updated_at)
        VALUES
          ($target_tile_id, 750, 750, 750, 750, $updated_at),
          ($source_tile_id, 750, 750, 750, 750, $updated_at)
        ON CONFLICT(tile_id) DO NOTHING
      `,
      bind: {
        $target_tile_id: targetVillage.tile_id,
        $source_tile_id: sourceTileId,
        $updated_at: Date.now(),
      },
    });

    const heroUnitId = database.selectValue({
      sql: "SELECT id FROM unit_ids WHERE unit = 'HERO'",
      schema: z.number(),
    })!;

    database.exec({
      sql: `
        INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
        VALUES ($tile_id, $source_tile_id, $unit_id, 2)
      `,
      bind: {
        $tile_id: targetVillage.tile_id,
        $source_tile_id: sourceTileId,
        $unit_id: heroUnitId,
      },
    });

    database.exec({
      sql: `
        UPDATE heroes
        SET village_id = $village_id
        WHERE player_id = $player_id
      `,
      bind: {
        $village_id: sourceVillageId,
        $player_id: playerId,
      },
    });

    const wheatEffectId = database.selectValue({
      sql: "SELECT id FROM effect_ids WHERE effect = 'wheatProduction'",
      schema: z.number(),
    })!;

    database.exec({
      sql: `
        INSERT INTO effects (effect_id, value, type, scope, source, village_id, source_specifier)
        VALUES ($effect_id, $value, 'base', 'village', 'hero', $village_id, 0)
      `,
      bind: {
        $effect_id: wheatEffectId,
        $value: 1,
        $village_id: sourceVillageId,
      },
    });

    database.exec({
      sql: `
        UPDATE effects
        SET village_id = $village_id
        WHERE
          source = 'hero'
          AND scope = 'village'
      `,
      bind: {
        $village_id: sourceVillageId,
      },
    });

    relocateReinforcements(
      database,
      createControllerArgs<
        '/villages/:villageId/relocate-reinforcements',
        'post'
      >({
        path: { villageId: targetVillage.id },
        body: {
          sourceTileId,
          troops: [{ unitId: 'HERO', amount: 1 }],
        },
      }),
    );

    const heroVillageId = database.selectValue({
      sql: 'SELECT village_id FROM heroes WHERE player_id = $player_id',
      bind: { $player_id: playerId },
      schema: z.number(),
    });

    const heroEffectVillageIds = database.selectValues({
      sql: `
        SELECT village_id
        FROM effects
        WHERE
          source = 'hero'
          AND scope = 'village'
      `,
      schema: z.number(),
    });

    expect(heroVillageId).toBe(targetVillage.id);
    expect(heroEffectVillageIds.length).toBeGreaterThan(0);
    expect(heroEffectVillageIds.every((id) => id === targetVillage.id)).toBe(
      true,
    );
  });

  test('getPlayerBySlug should return player details by slug', async () => {
    const database = await prepareTestDatabase();

    const player = database.selectObject({
      sql: 'SELECT slug FROM players WHERE id = $player_id',
      bind: { $player_id: playerId },
      schema: z.strictObject({ slug: z.string() }),
    })!;

    const result = getPlayerBySlug(
      database,
      createControllerArgs<'/players/:playerSlug'>({
        path: { playerSlug: player.slug },
      }),
    );

    expect(result).toBeDefined();
    expect(result.slug).toBe(player.slug);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
  });
});
