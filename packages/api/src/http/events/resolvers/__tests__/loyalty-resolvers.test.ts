import { afterEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { createLoyaltyIncreaseEventMock } from '@pillage-first/mocks/event';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { selectTileLoyaltyQuery } from '../../../../queries/loyalty-queries';
import { createLoyaltyIncreaseEvent } from '../../../../utils/loyalty';
import {
  initScheduler,
  resetSchedulerForTesting,
  scheduleNextEvent,
} from '../../scheduler/scheduler';
import { createSchedulerDataSource } from '../../scheduler/scheduler-data-source';
import { loyaltyIncreaseResolver } from '../loyalty-resolvers';

describe(loyaltyIncreaseResolver, () => {
  afterEach(() => {
    resetSchedulerForTesting();
    vi.useRealTimers();
  });

  test('offline loyalty recovery matches live ticks aligned to server creation', async () => {
    const createdAt = 1_000_000;
    const hour = 3_600_000;
    const start = createdAt + hour / 4;
    const end = start + 8 * hour;

    const run = async (offline: boolean) => {
      using database = await prepareTestDatabase();

      resetSchedulerForTesting();
      vi.useFakeTimers();
      vi.setSystemTime(start);
      database.exec({ sql: 'DELETE FROM events;' });
      database.exec({ sql: 'DELETE FROM loyalties;' });
      database.exec({
        sql: 'UPDATE servers SET created_at = $created_at, speed = 1;',
        bind: { $created_at: createdAt },
      });
      database.exec({
        sql: "DELETE FROM building_fields WHERE village_id = 1 AND building_id = (SELECT id FROM building_ids WHERE building = 'RESIDENCE');",
      });
      database.exec({
        sql: 'INSERT INTO loyalties (tile_id, loyalty) SELECT tile_id, 50 FROM villages WHERE id = 1;',
      });
      createLoyaltyIncreaseEvent(database, start);

      const dataSource = createSchedulerDataSource(database);
      initScheduler(dataSource);

      if (offline) {
        vi.setSystemTime(end);
        scheduleNextEvent(dataSource);
      } else {
        scheduleNextEvent(dataSource);
        vi.advanceTimersByTime(8 * hour);
      }

      const result = {
        loyalty: database.selectValue({
          sql: 'SELECT loyalty FROM loyalties;',
          schema: z.number(),
        }),
        nextTicks: database.selectValues({
          sql: "SELECT resolves_at FROM events WHERE type = 'loyaltyIncrease';",
          schema: z.number(),
        }),
      };

      resetSchedulerForTesting();

      return result;
    };

    const live = await run(false);

    expect(await run(true)).toStrictEqual(live);
    expect(live).toStrictEqual({
      loyalty: 58,
      nextTicks: [createdAt + 9 * hour],
    });
  });

  test('does not duplicate a loyalty tick that is overdue in real time', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(100_000_000);

    const startsAt = 1_000_000;
    createLoyaltyIncreaseEvent(database, startsAt);
    createLoyaltyIncreaseEvent(database, startsAt);

    expect(
      database.selectValue({
        sql: "SELECT COUNT(*) FROM events WHERE type = 'loyaltyIncrease';",
        schema: z.number(),
      }),
    ).toBe(1);
  });

  test('should increase loyalty for all villages and oases', async () => {
    using database = await prepareTestDatabase();

    // Village 1: Level 3 Residence (50 -> 54)
    const v1 = 1;
    const v1Tile = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
      bind: { $village_id: v1 },
      schema: tileIdSchema,
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
    const v2 = database.selectValue({
      sql: `
        SELECT v.id
        FROM villages v
        LEFT JOIN building_fields bf
          ON bf.village_id = v.id
          AND bf.building_id = (SELECT id FROM building_ids WHERE building = 'RESIDENCE')
        WHERE bf.village_id IS NULL
        LIMIT 1
      `,
      schema: z.number(),
    })!;

    const v2Tile = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
      bind: { $village_id: v2 },
      schema: tileIdSchema,
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
      sql: selectTileLoyaltyQuery,
      bind: { $tile_id: v1Tile },
      schema: z.number(),
    });

    const v2Loyalty = database.selectValue({
      sql: selectTileLoyaltyQuery,
      bind: { $tile_id: v2Tile },
      schema: z.number(),
    });

    const oasisLoyalty = database.selectValue({
      sql: selectTileLoyaltyQuery,
      bind: { $tile_id: oasisTile },
      schema: z.number(),
    });

    expect(v1Loyalty).toBe(54);
    expect(v2Loyalty).toBe(61);
    expect(oasisLoyalty).toBe(71);
  });

  test('should increase loyalty by 1% (base) if no Residence exists', async () => {
    using database = await prepareTestDatabase();
    const villageId = 1;
    const tileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
      bind: { $village_id: villageId },
      schema: tileIdSchema,
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
      sql: selectTileLoyaltyQuery,
      bind: { $tile_id: tileId },
      schema: z.number(),
    });

    // 50 + (1 + 0) = 51
    expect(loyalty).toBe(51);
  });

  test('should delete loyalty record if loyalty reaches 100%', async () => {
    using database = await prepareTestDatabase();
    const villageId = 1;
    const tileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
      bind: { $village_id: villageId },
      schema: tileIdSchema,
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
      sql: selectTileLoyaltyQuery,
      bind: { $tile_id: tileId },
      schema: z.number(),
    });

    expect(loyalties).toHaveLength(0);
  });

  test('should schedule next loyaltyIncrease event when loyalties still exist', async () => {
    using database = await prepareTestDatabase();
    const resolvesAt = Date.now();

    const tileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = 1',
      schema: tileIdSchema,
    })!;

    database.exec({
      sql: 'INSERT INTO loyalties (tile_id, loyalty) VALUES ($tile_id, 50)',
      bind: { $tile_id: tileId },
    });

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

    const starts_at = database.selectValue({
      sql: "SELECT starts_at FROM events WHERE type = 'loyaltyIncrease'",
      schema: z.number(),
    })!;

    expect(starts_at).toBe(resolvesAt);
  });

  test('should not schedule next loyaltyIncrease event when no loyalties remain', async () => {
    using database = await prepareTestDatabase();
    const resolvesAt = Date.now();

    database.exec({ sql: 'DELETE FROM loyalties;' });
    database.exec({ sql: "DELETE FROM events WHERE type = 'loyaltyIncrease'" });

    loyaltyIncreaseResolver(
      database,
      createLoyaltyIncreaseEventMock({
        villageId: null,
        duration: 3_600_000,
        resolvesAt,
        startsAt: resolvesAt - 3_600_000,
      }),
    );

    const eventCount = database.selectValue({
      sql: "SELECT COUNT(*) FROM events WHERE type = 'loyaltyIncrease'",
      schema: z.number(),
    })!;

    expect(eventCount).toBe(0);
  });
});
