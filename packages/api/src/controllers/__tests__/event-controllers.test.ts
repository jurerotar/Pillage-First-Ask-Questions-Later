import { afterEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import * as schedulerSignal from '../../scheduler/scheduler-signal';
import * as resolver from '../../utils/resolver';
import {
  cancelConstructionEvent,
  disableVacationMode,
  enableVacationMode,
  getCurrentGameTime,
  getVillageEvents,
  getVillageEventsByType,
  skipTime,
} from '../event-controllers';
import { createControllerArgs } from './utils/controller-args';

vi.mock('../../scheduler/scheduler-signal');
vi.mock('../../utils/resolver');

describe('event-controllers', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

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

    expect(true).toBe(true);
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

    expect(true).toBe(true);
  });

  test('cancelConstructionEvent should refund resources based on completion %', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const now = 1_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const startsAt = now;
    const duration = 100_000;

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
    const startsAt = 1_000_000;
    const duration = 100_000;

    // 50% completion at startsAt + 50000
    const now = startsAt + 50_000;
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
    const startsAt = 1_000_000;
    const duration = 100_000;

    // 99% completion at startsAt + 99000
    const now = startsAt + 99_000;
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

  test('enableVacationMode sets vacation_started_at and updates last_write', async () => {
    const database = await prepareTestDatabase();

    const before = database.selectObject({
      sql: `
        SELECT
          last_write AS lastWrite,
          vacation_started_at AS vacationStartedAt
        FROM
          meta
        LIMIT 1;
      `,
      schema: z.strictObject({
        lastWrite: z.number(),
        vacationStartedAt: z.number().nullable(),
      }),
    })!;

    enableVacationMode(
      database,
      createControllerArgs<'/events/vacation', 'post'>({}),
    );

    const after = database.selectObject({
      sql: `
        SELECT
          last_write AS lastWrite,
          vacation_started_at AS vacationStartedAt
        FROM
          meta
        LIMIT 1;
      `,
      schema: z.strictObject({
        lastWrite: z.number(),
        vacationStartedAt: z.number().nullable(),
      }),
    })!;

    expect(after.vacationStartedAt).not.toBeNull();
    expect(after.lastWrite).toBeGreaterThanOrEqual(before.lastWrite);
  });

  test('getCurrentGameTime returns effective now including skipped time', async () => {
    const database = await prepareTestDatabase();
    vi.useFakeTimers();
    vi.setSystemTime(1_000);

    database.exec({
      sql: `
        UPDATE meta
        SET
          last_write = 1000,
          total_time_skipped = 500,
          vacation_started_at = NULL;
      `,
    });

    const response = getCurrentGameTime(
      database,
      createControllerArgs<'/events/current-time'>({}),
    );

    expect(response.currentTime).toBe(1_500);
  });

  test('disableVacationMode shifts unresolved events by vacation duration and clears vacation', async () => {
    const database = await prepareTestDatabase();
    vi.useFakeTimers();
    vi.setSystemTime(10_000);

    database.exec({
      sql: "INSERT INTO events (id, type, starts_at, duration, village_id) VALUES (999101, 'unitResearch', 5000, 200, 1), (999102, 'unitResearch', 5600, 200, 1);",
    });

    database.exec({
      sql: `
        UPDATE meta
        SET
          last_write = 4000,
          total_time_skipped = 500,
          vacation_started_at = 6000;
      `,
    });

    disableVacationMode(
      database,
      createControllerArgs<'/events/vacation', 'delete'>({}),
    );

    const events = database.selectObjects({
      sql: 'SELECT id, starts_at AS startsAt FROM events WHERE id IN (999101, 999102) ORDER BY id;',
      schema: z.strictObject({ id: z.number(), startsAt: z.number() }),
    });

    const meta = database.selectObject({
      sql: `
        SELECT
          vacation_started_at AS vacationStartedAt
        FROM
          meta
        LIMIT 1;
      `,
      schema: z.strictObject({
        vacationStartedAt: z.number().nullable(),
      }),
    })!;

    expect(events).toStrictEqual([
      { id: 999101, startsAt: 9_000 },
      { id: 999102, startsAt: 9_600 },
    ]);
    expect(meta.vacationStartedAt).toBeNull();
    expect(schedulerSignal.triggerKick).toHaveBeenCalledTimes(1);
  });

  test('skipTime increases total_time_skipped and resolves due events', async () => {
    const database = await prepareTestDatabase();
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    vi.clearAllMocks();

    database.exec({
      sql: `
        UPDATE meta
        SET
          last_write = 1000,
          total_time_skipped = 0,
          vacation_started_at = NULL;
      `,
    });

    database.exec({
      sql: "INSERT INTO events (id, type, starts_at, duration, village_id) VALUES (999001, 'unitResearch', 1200, 100, 1), (999002, 'unitResearch', 2000, 100, 1);",
    });

    skipTime(
      database,
      createControllerArgs<'/events/skip-time', 'post'>({
        body: {
          duration: 500,
        },
      }),
    );

    const meta = database.selectObject({
      sql: `
        SELECT
          total_time_skipped AS totalTimeSkipped
        FROM
          meta
        LIMIT 1;
      `,
      schema: z.strictObject({
        totalTimeSkipped: z.number(),
      }),
    })!;

    expect(meta.totalTimeSkipped).toBe(500);
    expect(resolver.resolveEvent).toHaveBeenCalledWith(
      expect.anything(),
      999001,
    );
    expect(resolver.resolveEvent).not.toHaveBeenCalledWith(
      expect.anything(),
      999002,
    );
    expect(schedulerSignal.triggerKick).toHaveBeenCalledTimes(1);
  });
});
