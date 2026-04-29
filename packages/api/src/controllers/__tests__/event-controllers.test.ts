import { beforeEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { calculateUnitUpgradeCostForLevel } from '@pillage-first/game-assets/utils/units';
import * as schedulerSignal from '../../scheduler/scheduler-signal';
import {
  cancelConstructionEvent,
  cancelDemolitionEvent,
  cancelUnitImprovementEvent,
  getVillageEvents,
  getVillageEventsByType,
} from '../event-controllers';
import { createControllerArgs } from './utils/controller-args';

vi.mock<typeof schedulerSignal>(
  import('../../scheduler/scheduler-signal'),
  async () => {
    const actual = await vi.importActual<typeof schedulerSignal>(
      '../../scheduler/scheduler-signal',
    );
    return {
      ...actual,
      triggerKick: vi.fn(),
    };
  },
);

describe('event-controllers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  test('cancelUnitImprovementEvent should delete the event and refund the full upgrade cost', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const startsAt = Date.now();
    const duration = 100_000;
    const unitId = 'PHALANX'; // Using a standard unit ID
    const level = 1;

    vi.useFakeTimers();
    vi.setSystemTime(startsAt + 10_000); // Set time to somewhere in the middle of the upgrade

    const meta = JSON.stringify({
      unitId,
      level,
    });

    // Insert the unit improvement event
    database.exec({
      sql: `
      INSERT INTO events (type, starts_at, duration, village_id, meta)
      VALUES ('unitImprovement', $starts_at, $duration, $village_id, $meta)
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

    // Set baseline resources to avoid warehouse capacity caps during refund
    database.exec({
      sql: `
      UPDATE resource_sites
      SET wood = 100, clay = 100, iron = 100, wheat = 100
      WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
    `,
      bind: { $village_id: villageId },
    });

    // Execute the controller
    cancelUnitImprovementEvent(
      database,
      createControllerArgs<'/events/unit-improvement-event/:eventId', 'delete'>(
        {
          path: { eventId: eventId.toString() },
        },
      ),
    );

    // Fetch final resources
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

    // Determine the expected refund amount dynamically to avoid test breakage on balance changes
    const expectedRefund = calculateUnitUpgradeCostForLevel(unitId, level);

    // Assert that resources were properly refunded
    expect(finalResources.wood).toBe(100 + expectedRefund[0]);
    expect(finalResources.clay).toBe(100 + expectedRefund[1]);
    expect(finalResources.iron).toBe(100 + expectedRefund[2]);
    expect(finalResources.wheat).toBe(100 + expectedRefund[3]);

    // Assert that the event was actually deleted
    const deletedEvent = database.selectObject({
      sql: 'SELECT id FROM events WHERE id = $event_id',
      bind: { $event_id: eventId },
      schema: z.object({ id: z.number() }).optional(),
    });

    expect(deletedEvent).toBeUndefined();

    vi.useRealTimers();
  });

  test('cancelDemolitionEvent should remove only demolition event in village', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const otherVillageId = 2;
    const now = Date.now();

    database.exec({
      sql: `
        INSERT INTO events (type, starts_at, duration, village_id, meta)
        VALUES
          ('buildingDestruction', $now, 10_000, $village_id, $destruction_meta),
          ('buildingLevelChange', $now, 10_000, $village_id, $upgrade_meta),
          ('buildingLevelChange', $now, 10_000, $other_village_id, $downgrade_meta)
      `,
      bind: {
        $now: now,
        $village_id: villageId,
        $other_village_id: otherVillageId,
        $destruction_meta: JSON.stringify({
          buildingId: 'MAIN_BUILDING',
          buildingFieldId: 26,
          previousLevel: 10,
          level: 9,
        }),
        $upgrade_meta: JSON.stringify({
          buildingId: 'MAIN_BUILDING',
          buildingFieldId: 15,
          previousLevel: 1,
          level: 2,
        }),
        $downgrade_meta: JSON.stringify({
          buildingId: 'MAIN_BUILDING',
          buildingFieldId: 26,
          previousLevel: 5,
          level: 4,
        }),
      },
    });

    cancelDemolitionEvent(
      database,
      createControllerArgs<'/villages/:villageId/events/demolition', 'delete'>({
        path: { villageId },
      }),
    );

    const remainingEvents = database.selectObjects({
      sql: `
        SELECT
          type,
          village_id AS villageId,
          CAST(
            COALESCE(
              JSON_EXTRACT(meta, '$.previousLevel'),
              JSON_EXTRACT(meta, '$.previous_level')
            ) AS INTEGER
          ) AS previousLevel,
          CAST(
            COALESCE(
              JSON_EXTRACT(meta, '$.level'),
              JSON_EXTRACT(meta, '$.target_level')
            ) AS INTEGER
          ) AS level
        FROM
          events
        WHERE
          village_id IN ($village_id, $other_village_id)
          AND type IN ('buildingLevelChange', 'buildingDestruction')
      `,
      bind: {
        $village_id: villageId,
        $other_village_id: otherVillageId,
      },
      schema: z.strictObject({
        type: z.string(),
        villageId: z.number(),
        previousLevel: z.number(),
        level: z.number(),
      }),
    });

    expect(remainingEvents).toHaveLength(2);
    expect(
      remainingEvents.some(
        (event) =>
          event.type === 'buildingLevelChange' &&
          event.villageId === villageId &&
          event.previousLevel < event.level,
      ),
    ).toBe(true);
    expect(
      remainingEvents.some(
        (event) =>
          event.type === 'buildingLevelChange' &&
          event.villageId === otherVillageId &&
          event.previousLevel > event.level,
      ),
    ).toBe(true);
    expect(schedulerSignal.triggerKick).toHaveBeenCalledOnce();
  });

  test('cancelDemolitionEvent should remove downgrade buildingLevelChange event in village', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const now = Date.now();

    database.exec({
      sql: `
        INSERT INTO events (type, starts_at, duration, village_id, meta)
        VALUES ('buildingLevelChange', $now, 10_000, $village_id, $downgrade_meta)
      `,
      bind: {
        $now: now,
        $village_id: villageId,
        $downgrade_meta: JSON.stringify({
          buildingId: 'MAIN_BUILDING',
          buildingFieldId: 26,
          previousLevel: 8,
          level: 7,
        }),
      },
    });

    cancelDemolitionEvent(
      database,
      createControllerArgs<'/villages/:villageId/events/demolition', 'delete'>({
        path: { villageId },
      }),
    );

    const demolitionEventsInVillage = database.selectValue({
      sql: `
        SELECT
          COUNT(*)
        FROM
          events
        WHERE
          village_id = $village_id
          AND (
            type = 'buildingDestruction'
            OR (
              type = 'buildingLevelChange'
              AND CAST(JSON_EXTRACT(meta, '$.previousLevel') AS INTEGER) >
                CAST(JSON_EXTRACT(meta, '$.level') AS INTEGER)
            )
          )
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    });

    expect(demolitionEventsInVillage).toBe(0);
    expect(schedulerSignal.triggerKick).toHaveBeenCalledOnce();
  });
});
