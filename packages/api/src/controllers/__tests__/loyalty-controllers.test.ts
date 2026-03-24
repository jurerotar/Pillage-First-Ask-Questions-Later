import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { getTileLoyalty } from '../loyalty-controllers';
import { loyaltyIncreaseResolver } from '../resolvers/loyalty-resolvers';
import { createControllerArgs } from './utils/controller-args';

describe('loyalty-controllers', () => {
  test('should return 100 if tile is not in loyalties table', async () => {
    const database = await prepareTestDatabase();
    const tileId = 1;

    // Ensure it's not in the table
    database.exec({
      sql: 'DELETE FROM loyalties WHERE tile_id = $tile_id',
      bind: { $tile_id: tileId },
    });

    const result = getTileLoyalty(
      database,
      createControllerArgs<'/tiles/:tileId/loyalty'>({ path: { tileId } }),
    );

    expect(result).toEqual({ loyalty: 100 });
  });

  test('should return current loyalty if tile is in loyalties table', async () => {
    const database = await prepareTestDatabase();
    const tileId = 2;
    const loyaltyValue = 75;

    database.exec({
      sql: 'INSERT INTO loyalties (tile_id, loyalty) VALUES ($tile_id, $loyalty)',
      bind: { $tile_id: tileId, $loyalty: loyaltyValue },
    });

    const result = getTileLoyalty(
      database,
      createControllerArgs<'/tiles/:tileId/loyalty'>({ path: { tileId } }),
    );

    expect(result).toEqual({ loyalty: loyaltyValue });
  });

  test('loyaltyIncreaseResolver should increment loyalty based on residence level and delete if >= 100', async () => {
    const database = await prepareTestDatabase();
    const villageId1 = 1;
    const villageId2 = 2;

    // Get tileIds for these villages from the seeded DB
    const tileId1 = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
      bind: { $village_id: villageId1 },
      schema: z.number(),
    })!;
    const tileId2 = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
      bind: { $village_id: villageId2 },
      schema: z.number(),
    })!;

    // Ensure we have a residence in both villages
    // Residence building ID is 'RESIDENCE'
    database.exec({
      sql: `
        INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level)
        VALUES ($village_id, 19, (SELECT id FROM building_ids WHERE building = 'RESIDENCE'), $level);
      `,
      bind: { $level: 1, $village_id: villageId1 },
    });
    database.exec({
      sql: `
        INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level)
        VALUES ($village_id, 19, (SELECT id FROM building_ids WHERE building = 'RESIDENCE'), $level);
      `,
      bind: { $level: 5, $village_id: villageId2 },
    });

    database.exec({
      sql: 'INSERT INTO loyalties (tile_id, loyalty) VALUES ($id1, 99), ($id2, 50)',
      bind: { $id1: tileId1, $id2: tileId2 },
    });

    // Resolve for village 1 (level 1 residence -> +2 loyalty)
    loyaltyIncreaseResolver(database, {
      id: 1,
      villageId: villageId1,
      duration: 1000,
      resolvesAt: Date.now(),
      startsAt: Date.now() - 1000,
      type: 'loyaltyIncrease',
    });

    // Resolve for village 2 (level 5 residence -> +6 loyalty)
    loyaltyIncreaseResolver(database, {
      id: 2,
      villageId: villageId2,
      duration: 1000,
      resolvesAt: Date.now(),
      startsAt: Date.now() - 1000,
      type: 'loyaltyIncrease',
    });

    const loyalty1 = database.selectValues({
      sql: 'SELECT loyalty FROM loyalties WHERE tile_id = $tile_id',
      bind: { $tile_id: tileId1 },
      schema: z.number(),
    });
    const loyalty2 = database.selectValues({
      sql: 'SELECT loyalty FROM loyalties WHERE tile_id = $tile_id',
      bind: { $tile_id: tileId2 },
      schema: z.number(),
    });

    expect(loyalty1).toHaveLength(0); // Should be deleted as it hit 101 (99 + 2)
    expect(loyalty2).toEqual([56]); // Should be 50 + (1 + 5) = 56
  });
});
