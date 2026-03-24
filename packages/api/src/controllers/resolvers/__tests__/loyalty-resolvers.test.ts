import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { createLoyaltyIncreaseEventMock } from '@pillage-first/mocks/event';
import { loyaltyIncreaseResolver } from '../loyalty-resolvers';

describe('loyaltyIncreaseResolver', () => {
  test('should increase loyalty by 1% + 1% per Residence level', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const tileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
      bind: { $village_id: villageId },
      schema: z.number(),
    })!;

    // Level 3 Residence
    database.exec({
      sql: `
        INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level)
        VALUES ($village_id, 19, (SELECT id FROM building_ids WHERE building = 'RESIDENCE'), $level);
      `,
      bind: { $level: 3, $village_id: villageId },
    });

    database.exec({
      sql: 'INSERT INTO loyalties (tile_id, loyalty) VALUES ($tile_id, 50)',
      bind: { $tile_id: tileId },
    });

    const duration = 3600000;
    const now = Date.now();

    loyaltyIncreaseResolver(
      database,
      createLoyaltyIncreaseEventMock({
        villageId,
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

    // 50 + (1 + 3) = 54
    expect(loyalty).toBe(54);
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

    const duration = 3600000;
    const now = Date.now();

    loyaltyIncreaseResolver(
      database,
      createLoyaltyIncreaseEventMock({
        villageId,
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

    const duration = 3600000;
    const now = Date.now();

    loyaltyIncreaseResolver(
      database,
      createLoyaltyIncreaseEventMock({
        villageId,
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

  test('should schedule next loyaltyIncrease event', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const resolvesAt = Date.now();

    // Clear existing events for this village to be sure
    database.exec({
      sql: 'DELETE FROM events WHERE village_id = $village_id',
      bind: { $village_id: villageId },
    });

    const duration = 3600000;

    loyaltyIncreaseResolver(
      database,
      createLoyaltyIncreaseEventMock({
        villageId,
        duration,
        resolvesAt,
        startsAt: resolvesAt - duration,
      }),
    );

    const nextEvent = database.selectObject({
      sql: "SELECT * FROM events WHERE village_id = $village_id AND type = 'loyaltyIncrease'",
      bind: { $village_id: villageId },
      schema: z.object({
        id: z.number(),
        village_id: z.number(),
        starts_at: z.number(),
        type: z.string(),
        duration: z.number(),
        data: z.string().nullable().optional(),
        resolves_at: z.number().optional(),
        meta: z.string().nullable().optional(),
      }),
    });

    expect(nextEvent).toBeDefined();
    expect(nextEvent?.starts_at).toBe(resolvesAt);
  });
});
