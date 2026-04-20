import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { createLoyaltyIncreaseEventMock } from '@pillage-first/mocks/event';
import { loyaltyIncreaseResolver } from '../loyalty-resolvers';

describe(loyaltyIncreaseResolver, () => {
  test('should increase loyalty for all villages and oases', async () => {
    const database = await prepareTestDatabase();

    // Village 1: Level 3 Residence (50 -> 54)
    const v1 = 1;
    const v1Tile = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
      bind: { $village_id: v1 },
      schema: z.number(),
    })!;
    database.exec({
      sql: `INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level)
            VALUES ($village_id, 19, (SELECT id FROM building_ids WHERE building = 'RESIDENCE'), $level);`,
      bind: { $level: 3, $village_id: v1 },
    });
    database.exec({
      sql: 'INSERT INTO loyalties (tile_id, loyalty) VALUES ($tile_id, 50)',
      bind: { $tile_id: v1Tile },
    });

    // Village 2: No Residence (60 -> 61)
    const v2 = 2;
    const v2Tile = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
      bind: { $village_id: v2 },
      schema: z.number(),
    })!;
    database.exec({
      sql: 'INSERT INTO loyalties (tile_id, loyalty) VALUES ($tile_id, 60)',
      bind: { $tile_id: v2Tile },
    });

    // Oasis: Static increase (70 -> 71)
    const oasisTile = database.selectValue({
      sql: 'SELECT tile_id FROM oasis LIMIT 1',
      schema: z.number(),
    })!;
    database.exec({
      sql: 'INSERT INTO loyalties (tile_id, loyalty) VALUES ($tile_id, 70)',
      bind: { $tile_id: oasisTile },
    });

    const duration = 3_600_000;
    const now = Date.now();

    loyaltyIncreaseResolver(
      database,
      createLoyaltyIncreaseEventMock({
        duration,
        resolvesAt: now,
        startsAt: now - duration,
      }),
    );

    const v1Loyalty = database.selectValue({
      sql: 'SELECT loyalty FROM loyalties WHERE tile_id = $tile_id',
      bind: { $tile_id: v1Tile },
      schema: z.number(),
    });
    const v2Loyalty = database.selectValue({
      sql: 'SELECT loyalty FROM loyalties WHERE tile_id = $tile_id',
      bind: { $tile_id: v2Tile },
      schema: z.number(),
    });
    const oasisLoyalty = database.selectValue({
      sql: 'SELECT loyalty FROM loyalties WHERE tile_id = $tile_id',
      bind: { $tile_id: oasisTile },
      schema: z.number(),
    });

    expect(v1Loyalty).toBe(54);
    expect(v2Loyalty).toBe(61);
    expect(oasisLoyalty).toBe(71);
  });

  test('should increase loyalty by 1% (base) if no Residence exists', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const tileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
      bind: { $village_id: villageId },
      schema: z.number(),
    })!;

    // Ensure NO Residence exists
    database.exec({
      sql: `
        DELETE FROM building_fields
        WHERE village_id = $village_id
        AND building_id = (SELECT id FROM building_ids WHERE building = 'RESIDENCE');
      `,
      bind: { $village_id: villageId },
    });

    database.exec({
      sql: 'INSERT INTO loyalties (tile_id, loyalty) VALUES ($tile_id, 50)',
      bind: { $tile_id: tileId },
    });

    const duration = 3_600_000;
    const now = Date.now();

    loyaltyIncreaseResolver(
      database,
      createLoyaltyIncreaseEventMock({
        duration,
        resolvesAt: now,
        startsAt: now - duration,
      }),
    );

    const loyalty = database.selectValue({
      sql: 'SELECT loyalty FROM loyalties WHERE tile_id = $tile_id',
      bind: { $tile_id: tileId },
      schema: z.number(),
    });

    // 50 + (1 + 0) = 51
    expect(loyalty).toBe(51);
  });

  test('should delete loyalty record if loyalty reaches 100%', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const tileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
      bind: { $village_id: villageId },
      schema: z.number(),
    })!;

    // Level 1 Residence (+2% increase)
    database.exec({
      sql: `
        INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level)
        VALUES ($village_id, 19, (SELECT id FROM building_ids WHERE building = 'RESIDENCE'), $level);
      `,
      bind: { $level: 1, $village_id: villageId },
    });

    database.exec({
      sql: 'INSERT INTO loyalties (tile_id, loyalty) VALUES ($tile_id, 99)',
      bind: { $tile_id: tileId },
    });

    const duration = 3_600_000;
    const now = Date.now();

    loyaltyIncreaseResolver(
      database,
      createLoyaltyIncreaseEventMock({
        duration,
        resolvesAt: now,
        startsAt: now - duration,
      }),
    );

    const loyalties = database.selectValues({
      sql: 'SELECT loyalty FROM loyalties WHERE tile_id = $tile_id',
      bind: { $tile_id: tileId },
      schema: z.number(),
    });

    expect(loyalties).toHaveLength(0);
  });

  test('should schedule next loyaltyIncrease event even if villageId is null', async () => {
    const database = await prepareTestDatabase();
    const resolvesAt = Date.now();

    // Clear existing events
    database.exec({ sql: "DELETE FROM events WHERE type = 'loyaltyIncrease'" });

    const duration = 3_600_000;

    loyaltyIncreaseResolver(
      database,
      createLoyaltyIncreaseEventMock({
        villageId: null,
        duration,
        resolvesAt,
        startsAt: resolvesAt - duration,
      }),
    );

    const { starts_at } = database.selectObject({
      sql: "SELECT starts_at FROM events WHERE type = 'loyaltyIncrease'",
      schema: z.strictObject({
        starts_at: z.number(),
      }),
    })!;

    expect(starts_at).toBe(resolvesAt);
  });
});
