import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { createBuildingLevelChangeEventMock } from '@pillage-first/mocks/event';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { buildingLevelChangeResolver } from '../../events/resolvers/building-resolvers';
import { abandonOasis, occupyOasis } from '../oasis-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('oasis-controllers', () => {
  const villageRowSchema = z.strictObject({
    id: z.number(),
    player_id: z.number(),
    tile_id: z.number(),
  });

  const insertResourceSite = (database: DbFacade, tileId: number) => {
    database.exec({
      sql: `
        INSERT INTO resource_sites (tile_id, wood, clay, iron, wheat, updated_at)
        VALUES ($tile_id, 750, 750, 750, 750, $updated_at)
        ON CONFLICT(tile_id) DO NOTHING;
      `,
      bind: {
        $tile_id: tileId,
        $updated_at: Date.now(),
      },
    });
  };

  const insertVillage = (
    database: DbFacade,
    tileId: number,
    playerId: number,
    name: string,
  ) => {
    insertResourceSite(database, tileId);

    return database.selectValue({
      sql: `
        INSERT INTO villages (name, slug, tile_id, player_id)
        VALUES ($name, $slug, $tile_id, $player_id)
        RETURNING id;
      `,
      bind: {
        $name: name,
        $slug: `${name.toLowerCase().replaceAll(' ', '-')}-${tileId}`,
        $tile_id: tileId,
        $player_id: playerId,
      },
      schema: z.number(),
    })!;
  };

  const insertTroops = (
    database: DbFacade,
    tileId: number,
    sourceTileId: number,
    unitId: string,
    amount: number,
  ) => {
    database.exec({
      sql: `
        INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
        VALUES (
          $tile_id,
          $source_tile_id,
          (SELECT id FROM unit_ids WHERE unit = $unit_id),
          $amount
        );
      `,
      bind: {
        $tile_id: tileId,
        $source_tile_id: sourceTileId,
        $unit_id: unitId,
        $amount: amount,
      },
    });
  };

  const upsertWaterworks = (
    database: DbFacade,
    villageId: number,
    buildingFieldId: number,
    level: number,
  ) => {
    database.exec({
      sql: `
        INSERT INTO building_fields (village_id, field_id, building_id, level)
        VALUES (
          $village_id,
          $field_id,
          (SELECT id FROM building_ids WHERE building = 'WATERWORKS'),
          $level
        )
        ON CONFLICT(village_id, field_id)
        DO UPDATE SET
          building_id = excluded.building_id,
          level = excluded.level;
      `,
      bind: {
        $village_id: villageId,
        $field_id: buildingFieldId,
        $level: level,
      },
    });
  };

  const selectOccupiedOasisBonusEffects = (
    database: DbFacade,
    villageTileId: number,
    oasisTileId: number,
  ) => {
    return database.selectObjects({
      sql: `
        SELECT
          e.value,
          o.bonus
        FROM
          effects e
            JOIN effect_ids ei ON ei.id = e.effect_id
            JOIN resource_ids ri ON ei.effect = ri.resource || 'Production'
            JOIN oasis o ON o.resource_id = ri.id
              AND o.tile_id = e.source_specifier
        WHERE
          e.tile_id = $village_tile_id
          AND e.source_specifier = $oasis_tile_id
          AND e.type_id = (SELECT id FROM effect_type_ids WHERE type = 'bonus')
          AND e.source_id = (SELECT id FROM effect_source_ids WHERE source = 'oasis')
        ORDER BY
          ei.effect;
      `,
      bind: {
        $village_tile_id: villageTileId,
        $oasis_tile_id: oasisTileId,
      },
      schema: z.strictObject({
        value: z.number(),
        bonus: z.number(),
      }),
    });
  };

  test('occupyOasis should occupy an oasis', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id, player_id, tile_id FROM villages LIMIT 1',
      schema: villageRowSchema,
    })!;

    const oasisTileId = database.selectValue({
      sql: 'SELECT tile_id FROM oasis WHERE village_id IS NULL LIMIT 1',
      schema: z.number(),
    })!;

    occupyOasis(
      database,
      createControllerArgs<'/tiles/:tileId/oasis/:oasisTileId', 'post'>({
        path: { tileId: village.tile_id, oasisTileId },
      }),
    );

    const occupyingVillageId = database.selectValue({
      sql: 'SELECT village_id FROM oasis WHERE tile_id = $tile_id',
      bind: { $tile_id: oasisTileId },
      schema: z.number().nullable(),
    });

    expect(occupyingVillageId).toBe(village.id);
  });

  test('occupyOasis should move oasis effects from previous owner', async () => {
    const database = await prepareTestDatabase();

    const [previousOwner, nextOwner] = database.selectObjects({
      sql: 'SELECT id, player_id, tile_id FROM villages ORDER BY id LIMIT 2',
      schema: villageRowSchema,
    });

    const oasisTileId = database.selectValue({
      sql: 'SELECT tile_id FROM oasis WHERE village_id IS NULL LIMIT 1',
      schema: z.number(),
    })!;

    occupyOasis(
      database,
      createControllerArgs<'/tiles/:tileId/oasis/:oasisTileId', 'post'>({
        path: { tileId: previousOwner!.tile_id, oasisTileId },
      }),
    );

    occupyOasis(
      database,
      createControllerArgs<'/tiles/:tileId/oasis/:oasisTileId', 'post'>({
        path: { tileId: nextOwner!.tile_id, oasisTileId },
      }),
    );

    const previousOwnerEffectCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          effects
        WHERE
          tile_id = $tile_id
          AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'oasis')
          AND source_specifier = $oasis_tile_id;
      `,
      bind: {
        $tile_id: previousOwner!.tile_id,
        $oasis_tile_id: oasisTileId,
      },
      schema: z.number(),
    });

    const nextOwnerEffectCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          effects
        WHERE
          tile_id = $tile_id
          AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'oasis')
          AND source_specifier = $oasis_tile_id;
      `,
      bind: {
        $tile_id: nextOwner!.tile_id,
        $oasis_tile_id: oasisTileId,
      },
      schema: z.number(),
    });

    expect(previousOwnerEffectCount).toBe(0);
    expect(nextOwnerEffectCount).toBeGreaterThan(0);
  });

  test('occupyOasis should apply current Waterworks multiplier to oasis effects', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id, player_id, tile_id FROM villages LIMIT 1',
      schema: villageRowSchema,
    })!;

    upsertWaterworks(database, village.id, 19, 20);

    const oasisTileId = database.selectValue({
      sql: 'SELECT tile_id FROM oasis WHERE village_id IS NULL LIMIT 1',
      schema: z.number(),
    })!;

    occupyOasis(
      database,
      createControllerArgs<'/tiles/:tileId/oasis/:oasisTileId', 'post'>({
        path: { tileId: village.tile_id, oasisTileId },
      }),
    );

    const effects = selectOccupiedOasisBonusEffects(
      database,
      village.tile_id,
      oasisTileId,
    );

    expect(effects.length).toBeGreaterThan(0);

    for (const { value, bonus } of effects) {
      expect(value).toBe(1 + (bonus / 100) * 2);
    }
  });

  test('Waterworks level changes should update occupied oasis effects', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id, player_id, tile_id FROM villages LIMIT 1',
      schema: villageRowSchema,
    })!;

    const oasisTileId = database.selectValue({
      sql: 'SELECT tile_id FROM oasis WHERE village_id IS NULL LIMIT 1',
      schema: z.number(),
    })!;

    occupyOasis(
      database,
      createControllerArgs<'/tiles/:tileId/oasis/:oasisTileId', 'post'>({
        path: { tileId: village.tile_id, oasisTileId },
      }),
    );

    upsertWaterworks(database, village.id, 19, 1);

    buildingLevelChangeResolver(
      database,
      createBuildingLevelChangeEventMock({
        villageId: village.id,
        buildingId: 'WATERWORKS',
        buildingFieldId: 19,
        previousLevel: 1,
        level: 20,
      }),
    );

    const effects = selectOccupiedOasisBonusEffects(
      database,
      village.tile_id,
      oasisTileId,
    );

    expect(effects.length).toBeGreaterThan(0);

    for (const { value, bonus } of effects) {
      expect(value).toBe(1 + (bonus / 100) * 2);
    }
  });

  test('abandonOasis should abandon an oasis', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id, player_id, tile_id FROM villages LIMIT 1',
      schema: villageRowSchema,
    })!;

    const oasisTileId = database.selectValue({
      sql: 'SELECT tile_id FROM oasis WHERE village_id IS NULL LIMIT 1',
      schema: z.number(),
    })!;

    database.exec({
      sql: 'UPDATE oasis SET village_id = $village_id WHERE tile_id = $tile_id',
      bind: {
        $tile_id: oasisTileId,
        $village_id: village.id,
      },
    });

    abandonOasis(
      database,
      createControllerArgs<'/tiles/:tileId/oasis/:oasisTileId', 'delete'>({
        path: { tileId: village.tile_id, oasisTileId },
      }),
    );

    const occupyingVillageId = database.selectValue({
      sql: 'SELECT village_id FROM oasis WHERE tile_id = $tile_id',
      bind: { $tile_id: oasisTileId },
      schema: z.number().nullable(),
    });

    expect(occupyingVillageId).toBeNull();
  });

  test('abandonOasis should return oasis reinforcements to each source village', async () => {
    const database = await prepareTestDatabase();

    const owningVillage = database.selectObject({
      sql: 'SELECT id, player_id, tile_id FROM villages LIMIT 1',
      schema: villageRowSchema,
    })!;

    const oasisTileId = database.selectValue({
      sql: 'SELECT tile_id FROM oasis WHERE village_id IS NULL LIMIT 1',
      schema: z.number(),
    })!;

    database.exec({
      sql: 'UPDATE oasis SET village_id = $village_id WHERE tile_id = $tile_id',
      bind: {
        $tile_id: oasisTileId,
        $village_id: owningVillage.id,
      },
    });

    const sourceTileIds = database.selectValues({
      sql: `
        SELECT id
        FROM tiles
        WHERE id != $owning_tile_id
          AND id != $oasis_tile_id
          AND id NOT IN (SELECT tile_id FROM villages)
          AND id NOT IN (SELECT tile_id FROM oasis)
        ORDER BY id
        LIMIT 2;
      `,
      bind: {
        $oasis_tile_id: oasisTileId,
        $owning_tile_id: owningVillage.tile_id,
      },
      schema: z.number(),
    });

    expect(sourceTileIds).toHaveLength(2);

    const firstSourceVillageId = insertVillage(
      database,
      sourceTileIds[0],
      owningVillage.player_id,
      'First Oasis Reinforcement Source',
    );
    const secondSourceVillageId = insertVillage(
      database,
      sourceTileIds[1],
      owningVillage.player_id,
      'Second Oasis Reinforcement Source',
    );

    insertTroops(database, oasisTileId, sourceTileIds[0], 'LEGIONNAIRE', 5);
    insertTroops(database, oasisTileId, sourceTileIds[0], 'PRAETORIAN', 2);
    insertTroops(database, oasisTileId, sourceTileIds[1], 'PHALANX', 7);

    abandonOasis(
      database,
      createControllerArgs<'/tiles/:tileId/oasis/:oasisTileId', 'delete'>({
        path: { tileId: owningVillage.tile_id, oasisTileId },
      }),
    );

    const remainingReinforcements = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM troops
        WHERE tile_id = $oasis_tile_id
          AND source_tile_id IN ($first_source_tile_id, $second_source_tile_id);
      `,
      bind: {
        $first_source_tile_id: sourceTileIds[0],
        $oasis_tile_id: oasisTileId,
        $second_source_tile_id: sourceTileIds[1],
      },
      schema: z.number(),
    });

    const returnEvents = database.selectObjects({
      sql: `
        SELECT
          village_id,
          JSON_EXTRACT(meta, '$.originTileId') AS origin_tile_id,
          JSON_EXTRACT(meta, '$.targetTileId') AS target_tile_id,
          JSON_EXTRACT(meta, '$.troops[0].unitId') AS first_unit_id,
          JSON_EXTRACT(meta, '$.troops[0].amount') AS first_amount,
          JSON_ARRAY_LENGTH(JSON_EXTRACT(meta, '$.troops')) AS troop_groups
        FROM events
        WHERE type = 'troopMovementReturn'
          AND JSON_EXTRACT(meta, '$.originTileId') = $oasis_tile_id
        ORDER BY target_tile_id;
      `,
      bind: {
        $oasis_tile_id: oasisTileId,
      },
      schema: z.strictObject({
        village_id: z.number(),
        origin_tile_id: z.number(),
        target_tile_id: z.number(),
        first_unit_id: unitIdSchema,
        first_amount: z.number(),
        troop_groups: z.number(),
      }),
    });

    const occupyingVillageId = database.selectValue({
      sql: 'SELECT village_id FROM oasis WHERE tile_id = $tile_id',
      bind: { $tile_id: oasisTileId },
      schema: z.number().nullable(),
    });

    expect(remainingReinforcements).toBe(0);
    expect(occupyingVillageId).toBeNull();
    expect(returnEvents).toEqual([
      {
        first_amount: 5,
        first_unit_id: 'LEGIONNAIRE',
        origin_tile_id: oasisTileId,
        target_tile_id: sourceTileIds[0],
        troop_groups: 2,
        village_id: firstSourceVillageId,
      },
      {
        first_amount: 7,
        first_unit_id: 'PHALANX',
        origin_tile_id: oasisTileId,
        target_tile_id: sourceTileIds[1],
        troop_groups: 1,
        village_id: secondSourceVillageId,
      },
    ]);
  });
});
