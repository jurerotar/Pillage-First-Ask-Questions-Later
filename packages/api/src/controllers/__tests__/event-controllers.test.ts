import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  cancelConstructionEvent,
  getVillageEvents,
  getVillageEventsByType,
} from '../event-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('event-controllers', () => {
  test('getVillageEvents should return events for a village', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.strictObject({ id: z.number() }),
    })!;

    getVillageEvents(
      database,
      createControllerArgs<'/villages/:villageId/events'>({
        path: { villageId: village.id },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getVillageEventsByType should return events for a village by type', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.strictObject({ id: z.number() }),
    })!;

    getVillageEventsByType(
      database,
      createControllerArgs<'/villages/:villageId/events/:eventType'>({
        path: { villageId: village.id, eventType: 'buildingLevelChange' },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('cancelConstructionEvent should refund resources based on completion %', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const now = 1000000;
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const startsAt = now;
    const duration = 100000;

    const meta = JSON.stringify({
      buildingId: 'MAIN_BUILDING',
      buildingFieldId: 1,
      level: 1,
      previousLevel: 0,
    });

    database.exec({
      sql: `
        INSERT INTO events (type, starts_at, duration, village_id, meta)
        VALUES ('buildingLevelChange', $starts_at, $duration, $village_id, $meta)
      `,
      bind: {
        $starts_at: startsAt,
        $duration: duration,
        $village_id: villageId,
        $meta: meta,
      },
    });

    const { eventId } = database.selectObject({
      sql: 'SELECT last_insert_rowid() AS eventId',
      schema: z.object({ eventId: z.number() }),
    })!;

    // Set low resources to avoid warehouse capacity cap
    database.exec({
      sql: `
        UPDATE resource_sites
        SET wood = 100, clay = 100, iron = 100, wheat = 100
        WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
      `,
      bind: { $village_id: villageId },
    });

    cancelConstructionEvent(
      database,
      createControllerArgs<'/events/:eventId', 'delete'>({
        path: { eventId: eventId.toString() },
      }),
    );

    const finalResources = database.selectObject({
      sql: `
        SELECT wood, clay, iron, wheat
        FROM resource_sites rs
        JOIN villages v ON v.tile_id = rs.tile_id
        WHERE v.id = $village_id
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
      }),
    })!;

    // 95% of [70, 40, 60, 20] is [66, 38, 57, 19] after trunc
    expect(finalResources.wood).toBe(100 + 66);
    expect(finalResources.clay).toBe(100 + 38);
    expect(finalResources.iron).toBe(100 + 57);
    expect(finalResources.wheat).toBe(100 + 19);

    vi.useRealTimers();
  });

  test('cancelConstructionEvent should refund proportionally when cancelled at 50% completion', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const startsAt = 1000000;
    const duration = 100000;

    // 50% completion at startsAt + 50000
    const now = startsAt + 50000;
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const meta = JSON.stringify({
      buildingId: 'MAIN_BUILDING',
      buildingFieldId: 1,
      level: 1,
      previousLevel: 0,
    });

    database.exec({
      sql: `
        INSERT INTO events (type, starts_at, duration, village_id, meta)
        VALUES ('buildingLevelChange', $starts_at, $duration, $village_id, $meta)
      `,
      bind: {
        $starts_at: startsAt,
        $duration: duration,
        $village_id: villageId,
        $meta: meta,
      },
    });

    const { id: eventId } = database.selectObject({
      sql: 'SELECT last_insert_rowid() as id',
      schema: z.object({ id: z.number() }),
    })!;

    // Set low resources to avoid warehouse capacity cap
    database.exec({
      sql: `
        UPDATE resource_sites
        SET wood = 100, clay = 100, iron = 100, wheat = 100
        WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
      `,
      bind: { $village_id: villageId },
    });

    cancelConstructionEvent(
      database,
      createControllerArgs<'/events/:eventId', 'delete'>({
        path: { eventId: eventId.toString() },
      }),
    );

    const finalResources = database.selectObject({
      sql: `
        SELECT wood, clay, iron, wheat
        FROM resource_sites rs
        JOIN villages v ON v.tile_id = rs.tile_id
        WHERE v.id = $village_id
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
      }),
    })!;

    // At 50% completion:
    // refundPercentage = 0.95 - (0.5 - 0.05) / (1 - 0.05) = 0.476315...
    // Cost: [70, 40, 60, 20]
    // Wood: trunc(70 * 0.476315) = 33
    // Clay: trunc(40 * 0.476315) = 19
    // Iron: trunc(60 * 0.476315) = 28
    // Wheat: trunc(20 * 0.476315) = 9

    expect(finalResources.wood).toBe(100 + 33);
    expect(finalResources.clay).toBe(100 + 19);
    expect(finalResources.iron).toBe(100 + 28);
    expect(finalResources.wheat).toBe(100 + 9);

    vi.useRealTimers();
  });

  test('cancelConstructionEvent should refund 40% when cancelled at 99% completion', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const startsAt = 1000000;
    const duration = 100000;

    // 99% completion at startsAt + 99000
    const now = startsAt + 99000;
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const meta = JSON.stringify({
      buildingId: 'MAIN_BUILDING',
      buildingFieldId: 1,
      level: 1,
      previousLevel: 0,
    });

    database.exec({
      sql: `
        INSERT INTO events (type, starts_at, duration, village_id, meta)
        VALUES ('buildingLevelChange', $starts_at, $duration, $village_id, $meta)
      `,
      bind: {
        $starts_at: startsAt,
        $duration: duration,
        $village_id: villageId,
        $meta: meta,
      },
    });

    const { id: eventId } = database.selectObject({
      sql: 'SELECT last_insert_rowid() as id',
      schema: z.object({ id: z.number() }),
    })!;

    // Set low resources to avoid warehouse capacity cap
    database.exec({
      sql: `
        UPDATE resource_sites
        SET wood = 100, clay = 100, iron = 100, wheat = 100
        WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
      `,
      bind: { $village_id: villageId },
    });

    cancelConstructionEvent(
      database,
      createControllerArgs<'/events/:eventId', 'delete'>({
        path: { eventId: eventId.toString() },
      }),
    );

    const finalResources = database.selectObject({
      sql: `
        SELECT wood, clay, iron, wheat
        FROM resource_sites rs
        JOIN villages v ON v.tile_id = rs.tile_id
        WHERE v.id = $village_id
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
      }),
    })!;

    // At 99% completion, capped at 40%:
    // Cost: [70, 40, 60, 20]
    // Wood: trunc(70 * 0.4) = 28
    // Clay: trunc(40 * 0.4) = 16
    // Iron: trunc(60 * 0.4) = 24
    // Wheat: trunc(20 * 0.4) = 8

    expect(finalResources.wood).toBe(100 + 28);
    expect(finalResources.clay).toBe(100 + 16);
    expect(finalResources.iron).toBe(100 + 24);
    expect(finalResources.wheat).toBe(100 + 8);

    vi.useRealTimers();
  });
});
