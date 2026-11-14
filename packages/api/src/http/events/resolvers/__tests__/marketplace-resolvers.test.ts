import { afterEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import {
  createTestVillage,
  prepareTestDatabase,
  setTestBuildingLevel,
  setTestVillageResources,
} from '@pillage-first/api/testing';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  createResourceTransferEventMock,
  createTradeRouteEventMock,
} from '@pillage-first/mocks/event';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import {
  reportOutcomeSchema,
  reportTypeSchema,
} from '@pillage-first/types/models/report';
import {
  type Resources,
  resourcesSchema,
} from '@pillage-first/types/models/resource';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { insertTradeRouteQuery } from '../../../../queries/trade-route-queries';
import { scheduleTradeRoute } from '../../../../utils/trade-routes';
import { calculateResourceSiteResourcesAt } from '../../../../utils/village';
import { resolveEvent } from '../../resolve-event';
import {
  initScheduler,
  resetSchedulerForTesting,
  scheduleNextEvent,
} from '../../scheduler/scheduler';
import { createSchedulerDataSource } from '../../scheduler/scheduler-data-source';

const NOW = 1_000_000;

const getPlayerVillage = (
  database: Awaited<ReturnType<typeof prepareTestDatabase>>,
) =>
  database.selectObject({
    sql: `
      SELECT id, tile_id
      FROM villages
      WHERE player_id = $player_id
      ORDER BY id
      LIMIT 1;
    `,
    bind: { $player_id: PLAYER_ID },
    schema: z.strictObject({
      id: z.number(),
      tile_id: tileIdSchema,
    }),
  })!;

const getVillageResources = (
  database: Awaited<ReturnType<typeof prepareTestDatabase>>,
  tileId: number,
) =>
  database.selectObject({
    sql: 'SELECT wood, clay, iron, wheat FROM resource_sites WHERE tile_id = $tile_id;',
    bind: { $tile_id: tileId },
    schema: resourcesSchema,
  })!;

const insertEvent = (
  database: Awaited<ReturnType<typeof prepareTestDatabase>>,
  event: GameEvent<'resourceTransfer' | 'tradeRoute'>,
) =>
  database.selectValue({
    sql: `
      INSERT INTO events (type, starts_at, duration, village_id, meta)
      VALUES ($type, $starts_at, $duration, $village_id, $meta)
      RETURNING id;
    `,
    bind: {
      $type: event.type,
      $starts_at: event.startsAt,
      $duration: event.duration,
      $village_id: event.villageId,
      $meta: JSON.stringify(
        event.type === 'resourceTransfer'
          ? {
              targetVillageId: event.targetVillageId,
              originTileId: event.originTileId,
              targetTileId: event.targetTileId,
              resources: event.resources,
              merchantAmount: event.merchantAmount,
              repeatRemaining: event.repeatRemaining,
              repeatResources: event.repeatResources,
            }
          : { tradeRouteId: event.tradeRouteId },
      ),
    },
    schema: z.number(),
  })!;

const insertTradeRoute = (
  database: Awaited<ReturnType<typeof prepareTestDatabase>>,
  villageId: number,
  targetVillageId: number,
  resources: Resources,
  minimumResources: Resources,
  minimumMerchants = 0,
) => {
  const routeId = database.selectValue({
    sql: insertTradeRouteQuery,
    bind: {
      $village_id: villageId,
      $target_village_id: targetVillageId,
      $resources: JSON.stringify(resources),
      $minimum_resources: JSON.stringify(minimumResources),
      $minimum_merchants: minimumMerchants,
      $interval: 3_600_000,
      $starts_at: NOW,
    },
    schema: z.number(),
  })!;

  scheduleTradeRoute(database, routeId, villageId, NOW);

  return database.selectValue({
    sql: "SELECT id FROM events WHERE type = 'tradeRoute';",
    schema: z.number(),
  })!;
};

describe('marketplace resolvers', () => {
  afterEach(() => {
    resetSchedulerForTesting();
    vi.useRealTimers();
  });

  const runOvernightRoute = async (shipment: number, offline: boolean) => {
    const hour = 3_600_000;
    const end = NOW + 16 * hour;

    using database = await prepareTestDatabase();

    resetSchedulerForTesting();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    database.exec({ sql: 'DELETE FROM events;' });
    database.exec({ sql: 'DELETE FROM effects;' });

    const source = getPlayerVillage(database);
    const target = createTestVillage(database, 'Overnight Target', {
      resourceSite: { updatedAt: NOW },
    });
    setTestBuildingLevel(database, source.id, 'MARKETPLACE', 20, 32);

    for (const [tileId, production, capacity] of [
      [source.tile_id, 34000, 100000],
      [target.tileId, -shipment, 320000],
    ]) {
      for (const [effect, value] of [
        ['wheatProduction', production],
        ['granaryCapacity', capacity],
        ['warehouseCapacity', capacity],
        ['merchantCapacity', 100000],
      ] as const) {
        database.exec({
          sql: `
            INSERT INTO effects (effect_id, value, type_id, scope_id, source_id, tile_id, source_specifier)
            SELECT ei.id, $value, et.id, es.id, eso.id, $tile_id, 0
            FROM effect_ids ei, effect_type_ids et, effect_scope_ids es, effect_source_ids eso
            WHERE ei.effect = $effect AND et.type = 'base'
              AND es.scope = 'local' AND eso.source = 'building';
          `,
          bind: { $effect: effect, $value: value, $tile_id: tileId },
        });
      }
    }

    setTestVillageResources(
      database,
      source.tile_id,
      {
        wood: 0,
        clay: 0,
        iron: 0,
        wheat: 0,
      },
      NOW,
    );
    setTestVillageResources(
      database,
      target.tileId,
      {
        wood: 0,
        clay: 0,
        iron: 0,
        wheat: 320000,
      },
      NOW,
    );
    insertTradeRoute(
      database,
      source.id,
      target.id,
      { wood: 0, clay: 0, iron: 0, wheat: shipment },
      { wood: 0, clay: 0, iron: 0, wheat: 0 },
    );

    const dataSource = createSchedulerDataSource(database);
    initScheduler(dataSource);

    if (offline) {
      vi.setSystemTime(end);
      scheduleNextEvent(dataSource);
    } else {
      scheduleNextEvent(dataSource);
      vi.advanceTimersByTime(16 * hour);
    }

    const result = {
      source: calculateResourceSiteResourcesAt(database, source.tile_id, end)
        .currentWheat,
      target: calculateResourceSiteResourcesAt(database, target.tileId, end)
        .currentWheat,
      reports: database.selectValue({
        sql: 'SELECT COUNT(*) FROM trade_reports;',
        schema: z.number(),
      }),
    };

    resetSchedulerForTesting();

    return result;
  };

  test('offline hourly crop routes of 6000 match live processing', async () => {
    const live = await runOvernightRoute(6000, false);
    const offline = await runOvernightRoute(6000, true);

    expect(offline).toStrictEqual(live);
    expect(offline.source).toBe(94000);
    expect(offline.target).toBeGreaterThan(200000);
    expect(offline.reports).toBeGreaterThan(0);
  });

  test('offline hourly crop routes of 25000 match live processing', async () => {
    const live = await runOvernightRoute(25000, false);
    const offline = await runOvernightRoute(25000, true);

    expect(offline).toStrictEqual(live);
    expect(offline.source).toBe(75000);
    expect(offline.target).toBeGreaterThan(200000);
    expect(offline.reports).toBeGreaterThan(0);
  });

  test('overdue routes preserve the resource reserve at departure time', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const source = getPlayerVillage(database);
    const target = createTestVillage(database, 'Overdue Reserve Target', {
      resourceSite: { updatedAt: NOW },
    });
    setTestBuildingLevel(database, source.id, 'MARKETPLACE', 1, 32);
    setTestVillageResources(
      database,
      source.tile_id,
      {
        wood: 500,
        clay: 500,
        iron: 500,
        wheat: 500,
      },
      NOW,
    );
    const eventId = insertTradeRoute(
      database,
      source.id,
      target.id,
      { wood: 200, clay: 0, iron: 0, wheat: 0 },
      { wood: 400, clay: 0, iron: 0, wheat: 0 },
    );

    vi.setSystemTime(NOW + 16 * 3_600_000);
    resolveEvent(database, eventId);

    expect(getVillageResources(database, source.tile_id).wood).toBe(400);
    expect(
      database.selectValue({
        sql: "SELECT JSON_EXTRACT(meta, '$.resources.wood') FROM events WHERE type = 'resourceTransfer';",
        schema: z.number(),
      }),
    ).toBe(100);
    expect(
      database.selectValue({
        sql: 'SELECT updated_at FROM resource_sites WHERE tile_id = $tile_id;',
        bind: { $tile_id: source.tile_id },
        schema: z.number(),
      }),
    ).toBe(NOW);
  });

  test('resourceTransfer should add resources to target and create a zero-resource return transfer', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(database, 'Resolver Target', {
      resourceSite: { updatedAt: NOW },
    });

    const resolvesAt = NOW + 5000;

    setTestVillageResources(
      database,
      targetVillage.tileId,
      { wood: 200, clay: 200, iron: 200, wheat: 200 },
      resolvesAt,
    );

    const eventId = insertEvent(
      database,
      createResourceTransferEventMock({
        villageId: sourceVillage.id,
        targetVillageId: targetVillage.id,
        originTileId: sourceVillage.tile_id,
        targetTileId: targetVillage.tileId,
        startsAt: NOW,
        duration: 5000,
        merchantAmount: 1,
      }),
    );

    resolveEvent(database, eventId);

    expect(getVillageResources(database, targetVillage.tileId)).toStrictEqual({
      wood: 300,
      clay: 250,
      iron: 225,
      wheat: 210,
    });

    const tradeReport = database.selectObject({
      sql: `
        SELECT
          r.id AS report_id,
          r.village_id,
          r.timestamp,
          rti.report_type,
          roi.report_outcome,
          tr.origin_tile_id,
          tr.target_tile_id,
          tr.wood,
          tr.clay,
          tr.iron,
          tr.wheat
        FROM reports r
        JOIN report_type_ids rti ON rti.id = r.type_id
        JOIN report_outcome_ids roi ON roi.id = r.report_outcome_id
        JOIN trade_reports tr ON r.id = tr.report_id
        WHERE r.village_id = $village_id;
      `,
      bind: { $village_id: targetVillage.id },
      schema: z.strictObject({
        report_id: z.number(),
        village_id: z.number(),
        timestamp: z.number(),
        report_type: reportTypeSchema,
        report_outcome: reportOutcomeSchema,
        origin_tile_id: tileIdSchema,
        target_tile_id: tileIdSchema,
        ...resourcesSchema.shape,
      }),
    })!;

    expect(tradeReport).toMatchObject({
      village_id: targetVillage.id,
      timestamp: resolvesAt,
      report_type: 'trade',
      report_outcome: 'incomingMerchantsArrived',
      origin_tile_id: sourceVillage.tile_id,
      target_tile_id: targetVillage.tileId,
      wood: 100,
      clay: 50,
      iron: 25,
      wheat: 10,
    });
    expect(
      database.selectValue({
        sql: `
          SELECT COUNT(*)
          FROM reports r
          JOIN trade_reports tr ON tr.report_id = r.id
          WHERE tr.origin_tile_id = $origin_tile_id
            AND tr.target_tile_id = $target_tile_id;
        `,
        bind: {
          $origin_tile_id: sourceVillage.tile_id,
          $target_tile_id: targetVillage.tileId,
        },
        schema: z.number(),
      }),
    ).toBe(1);

    database.exec({
      sql: 'DELETE FROM reports WHERE id = $report_id;',
      bind: { $report_id: tradeReport.report_id },
    });

    expect(
      database.selectValue({
        sql: 'SELECT COUNT(*) FROM trade_reports WHERE report_id = $report_id;',
        bind: { $report_id: tradeReport.report_id },
        schema: z.number(),
      }),
    ).toBe(0);

    const transferCount = database.selectValue({
      sql: "SELECT COUNT(*) FROM events WHERE type = 'resourceTransfer';",
      schema: z.number(),
    });

    const returnEvent = database.selectObject({
      sql: `
        SELECT
          starts_at,
          duration,
          village_id,
          JSON_EXTRACT(meta, '$.targetVillageId') AS target_village_id,
          JSON_EXTRACT(meta, '$.originTileId') AS origin_tile_id,
          JSON_EXTRACT(meta, '$.targetTileId') AS target_tile_id,
          JSON_EXTRACT(meta, '$.resources.wood') AS wood,
          JSON_EXTRACT(meta, '$.resources.clay') AS clay,
          JSON_EXTRACT(meta, '$.resources.iron') AS iron,
          JSON_EXTRACT(meta, '$.resources.wheat') AS wheat,
          JSON_EXTRACT(meta, '$.merchantAmount') AS merchant_amount
        FROM events
        WHERE type = 'resourceTransfer';
      `,
      schema: z.strictObject({
        starts_at: z.number(),
        duration: z.number(),
        village_id: z.number(),
        target_village_id: z.number(),
        origin_tile_id: tileIdSchema,
        target_tile_id: tileIdSchema,
        ...resourcesSchema.shape,
        merchant_amount: z.number(),
      }),
    })!;

    expect(transferCount).toBe(1);
    expect(returnEvent).toMatchObject({
      starts_at: resolvesAt,
      village_id: sourceVillage.id,
      target_village_id: sourceVillage.id,
      origin_tile_id: targetVillage.tileId,
      target_tile_id: sourceVillage.tile_id,
      merchant_amount: 1,
      wood: 0,
      clay: 0,
      iron: 0,
      wheat: 0,
    });
    expect(returnEvent.duration).toBeGreaterThan(0);
  });

  test('zero-resource resourceTransfer should resolve without changing resources', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(database, 'Noop Return Target', {
      resourceSite: { updatedAt: NOW },
    });

    setTestVillageResources(
      database,
      sourceVillage.tile_id,
      {
        wood: 500,
        clay: 500,
        iron: 500,
        wheat: 500,
      },
      NOW,
    );

    const eventId = insertEvent(
      database,
      createResourceTransferEventMock({
        villageId: sourceVillage.id,
        targetVillageId: sourceVillage.id,
        originTileId: targetVillage.tileId,
        targetTileId: sourceVillage.tile_id,
        startsAt: NOW,
        duration: 5000,
        merchantAmount: 1,
        resources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
      }),
    );

    resolveEvent(database, eventId);

    expect(getVillageResources(database, sourceVillage.tile_id)).toStrictEqual({
      wood: 500,
      clay: 500,
      iron: 500,
      wheat: 500,
    });
    expect(
      database.selectValue({
        sql: "SELECT COUNT(*) FROM events WHERE type = 'resourceTransfer';",
        schema: z.number(),
      }),
    ).toBe(0);
  });

  test('returning repeated resourceTransfer should start the next transfer', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(database, 'Repeat Target', {
      resourceSite: { updatedAt: NOW },
    });

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 1, 32);
    setTestVillageResources(
      database,
      sourceVillage.tile_id,
      {
        wood: 500,
        clay: 500,
        iron: 500,
        wheat: 500,
      },
      NOW,
    );

    const eventId = insertEvent(
      database,
      createResourceTransferEventMock({
        villageId: sourceVillage.id,
        targetVillageId: sourceVillage.id,
        originTileId: targetVillage.tileId,
        targetTileId: sourceVillage.tile_id,
        startsAt: NOW,
        duration: 5000,
        merchantAmount: 1,
        resources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
        repeatRemaining: 2,
        repeatResources: { wood: 100, clay: 50, iron: 25, wheat: 10 },
      }),
    );

    resolveEvent(database, eventId);

    const nextTransfer = database.selectObject({
      sql: `
        SELECT
          starts_at,
          village_id,
          JSON_EXTRACT(meta, '$.targetVillageId') AS target_village_id,
          JSON_EXTRACT(meta, '$.originTileId') AS origin_tile_id,
          JSON_EXTRACT(meta, '$.targetTileId') AS target_tile_id,
          JSON_EXTRACT(meta, '$.resources.wood') AS wood,
          JSON_EXTRACT(meta, '$.resources.clay') AS clay,
          JSON_EXTRACT(meta, '$.resources.iron') AS iron,
          JSON_EXTRACT(meta, '$.resources.wheat') AS wheat,
          JSON_EXTRACT(meta, '$.merchantAmount') AS merchant_amount,
          JSON_EXTRACT(meta, '$.repeatRemaining') AS repeat_remaining,
          JSON_EXTRACT(meta, '$.repeatResources.wood') AS repeat_wood
        FROM events
        WHERE type = 'resourceTransfer';
      `,
      schema: z.strictObject({
        starts_at: z.number(),
        village_id: z.number(),
        target_village_id: z.number(),
        origin_tile_id: tileIdSchema,
        target_tile_id: tileIdSchema,
        ...resourcesSchema.shape,
        merchant_amount: z.number(),
        repeat_remaining: z.number(),
        repeat_wood: resourcesSchema.shape.wood,
      }),
    })!;

    expect(nextTransfer).toMatchObject({
      starts_at: NOW + 5000,
      village_id: sourceVillage.id,
      target_village_id: targetVillage.id,
      origin_tile_id: sourceVillage.tile_id,
      target_tile_id: targetVillage.tileId,
      wood: 100,
      clay: 50,
      iron: 25,
      wheat: 10,
      merchant_amount: 1,
      repeat_remaining: 1,
      repeat_wood: 100,
    });
    expect(getVillageResources(database, sourceVillage.tile_id)).toStrictEqual({
      wood: 400,
      clay: 450,
      iron: 475,
      wheat: 490,
    });
  });

  test('returning repeated resourceTransfer should stop when resources are missing', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(database, 'Missing Repeat Target', {
      resourceSite: { updatedAt: NOW },
    });

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 1, 32);
    setTestVillageResources(
      database,
      sourceVillage.tile_id,
      {
        wood: 0,
        clay: 0,
        iron: 0,
        wheat: 0,
      },
      NOW,
    );

    const eventId = insertEvent(
      database,
      createResourceTransferEventMock({
        villageId: sourceVillage.id,
        targetVillageId: sourceVillage.id,
        originTileId: targetVillage.tileId,
        targetTileId: sourceVillage.tile_id,
        startsAt: NOW,
        duration: 5000,
        merchantAmount: 1,
        resources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
        repeatRemaining: 2,
        repeatResources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      }),
    );

    resolveEvent(database, eventId);

    expect(
      database.selectValue({
        sql: "SELECT COUNT(*) FROM events WHERE type = 'resourceTransfer';",
        schema: z.number(),
      }),
    ).toBe(0);
    expect(getVillageResources(database, sourceVillage.tile_id)).toStrictEqual({
      wood: 0,
      clay: 0,
      iron: 0,
      wheat: 0,
    });
  });

  test('tradeRoute should create a transfer and schedule the next route trigger', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(database, 'Trade Route Target', {
      resourceSite: { updatedAt: NOW },
    });
    const interval = 6 * 60 * 60 * 1000;

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 1, 32);
    setTestVillageResources(
      database,
      sourceVillage.tile_id,
      {
        wood: 500,
        clay: 500,
        iron: 500,
        wheat: 500,
      },
      NOW,
    );

    const routeId = database.selectValue({
      sql: `
        INSERT INTO trade_routes (
          village_id,
          target_village_id,
          resources,
          interval,
          starts_at
        )
        VALUES ($source, $target, $resources, $interval, $starts_at)
        RETURNING id;
      `,
      bind: {
        $source: sourceVillage.id,
        $target: targetVillage.id,
        $resources: JSON.stringify({
          wood: 100,
          clay: 50,
          iron: 25,
          wheat: 10,
        }),
        $interval: interval,
        $starts_at: NOW,
      },
      schema: z.number(),
    })!;

    const eventId = insertEvent(
      database,
      createTradeRouteEventMock({
        villageId: sourceVillage.id,
        tradeRouteId: routeId,
        startsAt: NOW,
        duration: 0,
      }),
    );

    resolveEvent(database, eventId);

    const eventCounts = database.selectObjects({
      sql: `
        SELECT type, COUNT(*) AS count
        FROM events
        GROUP BY type
        ORDER BY type;
      `,
      schema: z.strictObject({
        type: z.string(),
        count: z.number(),
      }),
    });

    const nextTradeRoute = database.selectObject({
      sql: `
        SELECT
          starts_at,
          duration,
          village_id,
          (
            SELECT interval
            FROM trade_routes
            WHERE id = JSON_EXTRACT(events.meta, '$.tradeRouteId')
          ) AS interval,
          JSON_TYPE(meta, '$.merchantAmount') AS merchant_amount_type
        FROM events
        WHERE type = 'tradeRoute';
      `,
      schema: z.strictObject({
        starts_at: z.number(),
        duration: z.number(),
        village_id: z.number(),
        interval: z.number(),
        merchant_amount_type: z.string().nullable(),
      }),
    })!;

    expect(eventCounts).toStrictEqual([
      { type: 'resourceTransfer', count: 1 },
      { type: 'tradeRoute', count: 1 },
    ]);
    expect(nextTradeRoute).toStrictEqual({
      starts_at: NOW + interval,
      duration: 0,
      village_id: sourceVillage.id,
      interval,
      merchant_amount_type: null,
    });
    expect(getVillageResources(database, sourceVillage.tile_id)).toStrictEqual({
      wood: 400,
      clay: 450,
      iron: 475,
      wheat: 490,
    });

    const transferEventId = database.selectValue({
      sql: "SELECT id FROM events WHERE type = 'resourceTransfer';",
      schema: z.number(),
    })!;

    resolveEvent(database, transferEventId);

    const tradeReport = database.selectObject({
      sql: `
        SELECT r.village_id, roi.report_outcome, tr.origin_tile_id, tr.target_tile_id
        FROM reports r
        JOIN report_outcome_ids roi ON roi.id = r.report_outcome_id
        JOIN trade_reports tr ON tr.report_id = r.id
        WHERE tr.origin_tile_id = $origin_tile_id
          AND tr.target_tile_id = $target_tile_id;
      `,
      bind: {
        $origin_tile_id: sourceVillage.tile_id,
        $target_tile_id: targetVillage.tileId,
      },
      schema: z.strictObject({
        village_id: z.number(),
        report_outcome: reportOutcomeSchema,
        origin_tile_id: tileIdSchema,
        target_tile_id: tileIdSchema,
      }),
    });

    expect(tradeReport).toStrictEqual({
      village_id: targetVillage.id,
      report_outcome: 'incomingMerchantsArrived',
      origin_tile_id: sourceVillage.tile_id,
      target_tile_id: targetVillage.tileId,
    });
  });

  test('tradeRoute sizes merchants for the surplus delivery and allows exactly the reserved number to remain free', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const source = getPlayerVillage(database);
    const target = createTestVillage(database, 'Surplus Route Target', {
      resourceSite: { updatedAt: NOW },
    });

    setTestBuildingLevel(database, source.id, 'MARKETPLACE', 3, 32);
    setTestVillageResources(
      database,
      source.tile_id,
      {
        wood: 400,
        clay: 300,
        iron: 200,
        wheat: 500,
      },
      NOW,
    );

    const eventId = insertTradeRoute(
      database,
      source.id,
      target.id,
      { wood: 800, clay: 300, iron: 300, wheat: 50 },
      { wood: 300, clay: 300, iron: 300, wheat: 300 },
      2,
    );

    resolveEvent(database, eventId);

    const transfer = database.selectValue({
      sql: "SELECT meta FROM events WHERE type = 'resourceTransfer';",
      schema: z.string().transform((value): unknown => JSON.parse(value)),
    });

    expect(transfer).toMatchObject({
      resources: { wood: 100, clay: 0, iron: 0, wheat: 50 },
      repeatResources: { wood: 100, clay: 0, iron: 0, wheat: 50 },
      merchantAmount: 1,
    });
    expect(getVillageResources(database, source.tile_id)).toStrictEqual({
      wood: 300,
      clay: 300,
      iron: 200,
      wheat: 450,
    });
    expect(
      database.selectValue({
        sql: "SELECT starts_at FROM events WHERE type = 'tradeRoute';",
        schema: z.number(),
      }),
    ).toBe(NOW + 3_600_000);
  });

  test('tradeRoute skips an empty surplus and runs a later departure when stock recovers', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const source = getPlayerVillage(database);
    const target = createTestVillage(database, 'Reserve Route Target', {
      resourceSite: { updatedAt: NOW },
    });

    setTestBuildingLevel(database, source.id, 'MARKETPLACE', 1, 32);
    setTestVillageResources(
      database,
      source.tile_id,
      {
        wood: 400,
        clay: 300,
        iron: 200,
        wheat: 500,
      },
      NOW,
    );

    const eventId = insertTradeRoute(
      database,
      source.id,
      target.id,
      { wood: 100, clay: 100, iron: 0, wheat: 100 },
      { wood: 400, clay: 500, iron: 200, wheat: 500 },
    );

    resolveEvent(database, eventId);

    expect(
      database.selectValue({
        sql: "SELECT COUNT(*) FROM events WHERE type = 'resourceTransfer';",
        schema: z.number(),
      }),
    ).toBe(0);
    expect(getVillageResources(database, source.tile_id)).toStrictEqual({
      wood: 400,
      clay: 300,
      iron: 200,
      wheat: 500,
    });

    const nextEvent = database.selectObject({
      sql: "SELECT id, starts_at FROM events WHERE type = 'tradeRoute';",
      schema: z.strictObject({ id: z.number(), starts_at: z.number() }),
    })!;

    expect(nextEvent.starts_at).toBe(NOW + 3_600_000);

    vi.setSystemTime(nextEvent.starts_at);
    setTestVillageResources(
      database,
      source.tile_id,
      {
        wood: 500,
        clay: 300,
        iron: 200,
        wheat: 500,
      },
      nextEvent.starts_at,
    );

    resolveEvent(database, nextEvent.id);

    expect(
      database.selectValue({
        sql: "SELECT JSON_EXTRACT(meta, '$.resources.wood') FROM events WHERE type = 'resourceTransfer';",
        schema: z.number(),
      }),
    ).toBe(100);
    expect(getVillageResources(database, source.tile_id)).toStrictEqual({
      wood: 400,
      clay: 300,
      iron: 200,
      wheat: 500,
    });
  });

  test('tradeRoute counts busy merchants and skips departures that would use reserved merchants', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const source = getPlayerVillage(database);
    const target = createTestVillage(database, 'Busy Route Target', {
      resourceSite: { updatedAt: NOW },
    });

    setTestBuildingLevel(database, source.id, 'MARKETPLACE', 2, 32);
    setTestVillageResources(
      database,
      source.tile_id,
      {
        wood: 500,
        clay: 500,
        iron: 500,
        wheat: 500,
      },
      NOW,
    );

    insertEvent(
      database,
      createResourceTransferEventMock({
        villageId: source.id,
        targetVillageId: source.id,
        originTileId: target.tileId,
        targetTileId: source.tile_id,
        startsAt: NOW,
        duration: 7_200_000,
        resources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
        merchantAmount: 1,
      }),
    );

    const eventId = insertTradeRoute(
      database,
      source.id,
      target.id,
      { wood: 100, clay: 0, iron: 0, wheat: 0 },
      { wood: 400, clay: 400, iron: 400, wheat: 400 },
      1,
    );

    resolveEvent(database, eventId);

    expect(
      database.selectValue({
        sql: "SELECT COUNT(*) FROM events WHERE type = 'resourceTransfer';",
        schema: z.number(),
      }),
    ).toBe(1);
    expect(getVillageResources(database, source.tile_id)).toStrictEqual({
      wood: 500,
      clay: 500,
      iron: 500,
      wheat: 500,
    });
    expect(
      database.selectValue({
        sql: "SELECT starts_at FROM events WHERE type = 'tradeRoute';",
        schema: z.number(),
      }),
    ).toBe(NOW + 3_600_000);
  });

  test('tradeRoute should schedule the next route when the transfer cannot start', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(
      database,
      'Failed Trade Route Target',
      {
        resourceSite: { updatedAt: NOW },
      },
    );

    const interval = 12 * 60 * 60 * 1000;

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 1, 32);
    setTestVillageResources(
      database,
      sourceVillage.tile_id,
      {
        wood: 0,
        clay: 0,
        iron: 0,
        wheat: 0,
      },
      NOW,
    );

    const routeId = database.selectValue({
      sql: `
        INSERT INTO trade_routes (
          village_id,
          target_village_id,
          resources,
          interval,
          starts_at
        )
        VALUES ($source, $target, $resources, $interval, $starts_at)
        RETURNING id;
      `,
      bind: {
        $source: sourceVillage.id,
        $target: targetVillage.id,
        $resources: JSON.stringify({ wood: 100, clay: 0, iron: 0, wheat: 0 }),
        $interval: interval,
        $starts_at: NOW,
      },
      schema: z.number(),
    })!;

    const eventId = insertEvent(
      database,
      createTradeRouteEventMock({
        villageId: sourceVillage.id,
        tradeRouteId: routeId,
        startsAt: NOW,
        duration: 0,
      }),
    );

    resolveEvent(database, eventId);

    expect(
      database.selectValue({
        sql: "SELECT COUNT(*) FROM events WHERE type = 'resourceTransfer';",
        schema: z.number(),
      }),
    ).toBe(0);

    const nextTradeRouteStartsAt = database.selectValue({
      sql: "SELECT starts_at FROM events WHERE type = 'tradeRoute';",
      schema: z.number(),
    });

    expect(nextTradeRouteStartsAt).toBe(NOW + interval);
    expect(getVillageResources(database, sourceVillage.tile_id)).toStrictEqual({
      wood: 0,
      clay: 0,
      iron: 0,
      wheat: 0,
    });
  });
});
