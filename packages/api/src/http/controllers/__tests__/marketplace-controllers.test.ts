import { afterEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import {
  createTestVillage,
  prepareTestDatabase,
  setTestBuildingLevel,
  setTestVillageResources,
} from '@pillage-first/api/testing';
import { merchantsMap } from '@pillage-first/game-assets/merchants';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  calculateBuildingEffectValues,
  getBuildingDefinition,
} from '@pillage-first/game-assets/utils/buildings';
import { resourcesSchema } from '@pillage-first/types/models/resource';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { selectTribeByVillageId } from '../../../queries/village-queries';
import {
  createTradeRoute,
  deleteTradeRoute,
  listTradeRoutes,
  setTradeRoutePaused,
  transferResources,
  updateTradeRoute,
} from '../marketplace-controllers';
import { createTradeRouteBodySchema } from '../schemas/marketplace-schemas';
import { createControllerArgs } from './utils/controller-args';

const NOW = 1_000_000;

const getPlayerVillage = (database: DbFacade) =>
  database.selectObject({
    sql: `
      SELECT
        v.id,
        v.tile_id AS tileId,
        ti.tribe
      FROM
        villages v
          JOIN players p ON p.id = v.player_id
          JOIN tribe_ids ti ON ti.id = p.tribe_id
      WHERE
        v.player_id = $player_id
      ORDER BY v.id
      LIMIT 1;
    `,
    bind: { $player_id: PLAYER_ID },
    schema: z.strictObject({
      id: z.number(),
      tileId: tileIdSchema,
      tribe: tribeSchema,
    }),
  })!;

const setTradeOfficeLevel = (
  database: DbFacade,
  villageId: number,
  level: number,
) => {
  const tribe = database.selectValue({
    sql: selectTribeByVillageId,
    bind: { $village_id: villageId },
    schema: tribeSchema,
  })!;

  setTestBuildingLevel(database, villageId, 'TRADE_OFFICE', level, 37);

  database.exec({
    sql: `
      DELETE
      FROM effects
      WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
        AND source_specifier = 37
        AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building');
    `,
    bind: {
      $village_id: villageId,
    },
  });

  database.exec({
    sql: `
      INSERT INTO effects (effect_id, value, type_id, scope_id, source_id, tile_id, source_specifier)
      VALUES (
        (SELECT id FROM effect_ids WHERE effect = 'merchantCapacity'),
        $value,
        (SELECT id FROM effect_type_ids WHERE type = 'bonus'),
        (SELECT id FROM effect_scope_ids WHERE scope = 'local'),
        (SELECT id FROM effect_source_ids WHERE source = 'building'),
        (SELECT tile_id FROM villages WHERE id = $village_id),
        37
      );
    `,
    bind: {
      $village_id: villageId,
      $value: calculateBuildingEffectValues(
        getBuildingDefinition('TRADE_OFFICE'),
        level,
        tribe,
      ).find(({ effectId }) => effectId === 'merchantCapacity')!
        .currentLevelValue,
    },
  });
};

const getVillageResources = (database: DbFacade, tileId: number) =>
  database.selectObject({
    sql: 'SELECT wood, clay, iron, wheat FROM resource_sites WHERE tile_id = $tile_id;',
    bind: {
      $tile_id: tileId,
    },
    schema: resourcesSchema,
  })!;

const getResourceTransferCount = (database: DbFacade) =>
  database.selectValue({
    sql: "SELECT COUNT(*) FROM events WHERE type = 'resourceTransfer';",
    schema: z.number(),
  })!;

const getNextStartAtForHour = (
  now: number,
  startHour: number,
  startMinute = 0,
) => {
  const startsAt = new Date(now);

  startsAt.setHours(startHour, startMinute, 0, 0);

  if (startsAt.getTime() <= now) {
    startsAt.setDate(startsAt.getDate() + 1);
  }

  return startsAt.getTime();
};

describe('marketplace-controllers', () => {
  test('accepts explicit zero trade route reserves', () => {
    const body = createTradeRouteBodySchema.parse({
      minimumMerchants: 0,
      minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      startHour: 12,
      intervalHours: 1,
    });

    expect(body.minimumResources).toStrictEqual({
      wood: 0,
      clay: 0,
      iron: 0,
      wheat: 0,
    });
    expect(body.minimumMerchants).toBe(0);
  });

  test('requires merchant reserves in the request', () => {
    const result = createTradeRouteBodySchema.safeParse({
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
      startHour: 12,
      intervalHours: 1,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path)).toStrictEqual([
      ['minimumMerchants'],
    ]);
  });

  test('requires resource reserves in the request', () => {
    const result = createTradeRouteBodySchema.safeParse({
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      minimumMerchants: 0,
      startHour: 12,
      intervalHours: 1,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path)).toStrictEqual([
      ['minimumResources'],
    ]);
  });

  test('rejects negative merchant reserves', () => {
    const result = createTradeRouteBodySchema.safeParse({
      minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      minimumMerchants: -1,
      startHour: 12,
      intervalHours: 1,
    });

    expect(result.success).toBe(false);
  });

  test('rejects fractional merchant reserves', () => {
    const result = createTradeRouteBodySchema.safeParse({
      minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      minimumMerchants: 1.5,
      startHour: 12,
      intervalHours: 1,
    });

    expect(result.success).toBe(false);
  });

  test('rejects negative trade route reserves', () => {
    const result = createTradeRouteBodySchema.safeParse({
      minimumMerchants: 0,
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      minimumResources: { wood: -1, clay: 0, iron: 0, wheat: 0 },
      startHour: 12,
      intervalHours: 1,
    });

    expect(result.success).toBe(false);
  });

  test('rejects fractional trade route reserves', () => {
    const result = createTradeRouteBodySchema.safeParse({
      minimumMerchants: 0,
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      minimumResources: { wood: 0, clay: 0, iron: 0.5, wheat: 0 },
      startHour: 12,
      intervalHours: 1,
    });

    expect(result.success).toBe(false);
  });

  test('rejects a negative start minute', () => {
    const result = createTradeRouteBodySchema.safeParse({
      minimumMerchants: 0,
      minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      startHour: 12,
      startMinute: -1,
      intervalHours: 1,
    });

    expect(result.success).toBe(false);
  });

  test('rejects a start minute of 60', () => {
    const result = createTradeRouteBodySchema.safeParse({
      minimumMerchants: 0,
      minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      startHour: 12,
      startMinute: 60,
      intervalHours: 1,
    });

    expect(result.success).toBe(false);
  });

  test('rejects a fractional start minute', () => {
    const result = createTradeRouteBodySchema.safeParse({
      minimumMerchants: 0,
      minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      startHour: 12,
      startMinute: 1.5,
      intervalHours: 1,
    });

    expect(result.success).toBe(false);
  });

  test('rejects a zero-hour interval with omitted minutes', () => {
    const result = createTradeRouteBodySchema.safeParse({
      minimumMerchants: 0,
      minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      startHour: 12,
      intervalHours: 0,
    });

    expect(result.success).toBe(false);
  });

  test('rejects a zero-hour and zero-minute interval', () => {
    const result = createTradeRouteBodySchema.safeParse({
      minimumMerchants: 0,
      minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      startHour: 12,
      intervalHours: 0,
      intervalMinutes: 0,
    });

    expect(result.success).toBe(false);
  });

  test('rejects negative interval hours', () => {
    const result = createTradeRouteBodySchema.safeParse({
      minimumMerchants: 0,
      minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      startHour: 12,
      intervalHours: -1,
      intervalMinutes: 30,
    });

    expect(result.success).toBe(false);
  });

  test('rejects fractional interval hours', () => {
    const result = createTradeRouteBodySchema.safeParse({
      minimumMerchants: 0,
      minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      startHour: 12,
      intervalHours: 1.5,
      intervalMinutes: 0,
    });

    expect(result.success).toBe(false);
  });

  test('rejects negative interval minutes', () => {
    const result = createTradeRouteBodySchema.safeParse({
      minimumMerchants: 0,
      minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      startHour: 12,
      intervalHours: 1,
      intervalMinutes: -1,
    });

    expect(result.success).toBe(false);
  });

  test('rejects interval minutes of 60', () => {
    const result = createTradeRouteBodySchema.safeParse({
      minimumMerchants: 0,
      minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      startHour: 12,
      intervalHours: 1,
      intervalMinutes: 60,
    });

    expect(result.success).toBe(false);
  });

  test('rejects fractional interval minutes', () => {
    const result = createTradeRouteBodySchema.safeParse({
      minimumMerchants: 0,
      minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
      targetTileId: 1,
      resources: { wood: 100, clay: 0, iron: 0, wheat: 0 },
      startHour: 12,
      intervalHours: 1,
      intervalMinutes: 1.5,
    });

    expect(result.success).toBe(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('transferResources should create a resource transfer and subtract source resources', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(database, 'Transfer Target', {
      resourceSite: { updatedAt: NOW },
    });

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 1, 32);
    setTestVillageResources(
      database,
      sourceVillage.tileId,
      {
        wood: 1000,
        clay: 1000,
        iron: 1000,
        wheat: 1000,
      },
      NOW,
    );

    transferResources(
      database,
      createControllerArgs<'/tiles/:tileId/transfer-resources', 'post'>({
        path: { tileId: sourceVillage.tileId },
        body: {
          targetTileId: targetVillage.tileId,
          resources: {
            wood: 100,
            clay: 50,
            iron: 25,
            wheat: 10,
          },
        },
      }),
    );

    const event = database.selectObject({
      sql: `
        SELECT
          type,
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
        type: z.literal('resourceTransfer'),
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

    expect(event).toMatchObject({
      starts_at: NOW,
      village_id: sourceVillage.id,
      target_village_id: targetVillage.id,
      origin_tile_id: sourceVillage.tileId,
      target_tile_id: targetVillage.tileId,
      wood: 100,
      clay: 50,
      iron: 25,
      wheat: 10,
      merchant_amount: 1,
    });
    expect(event.duration).toBeGreaterThan(0);
    expect(getVillageResources(database, sourceVillage.tileId)).toStrictEqual({
      wood: 700,
      clay: 750,
      iron: 775,
      wheat: 790,
    });
  });

  test('transferResources should create a repeated transfer chain starter', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(database, 'Repeated Transfer', {
      resourceSite: { updatedAt: NOW },
    });

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 1, 32);
    setTestVillageResources(
      database,
      sourceVillage.tileId,
      {
        wood: 1000,
        clay: 1000,
        iron: 1000,
        wheat: 1000,
      },
      NOW,
    );

    transferResources(
      database,
      createControllerArgs<'/tiles/:tileId/transfer-resources', 'post'>({
        path: { tileId: sourceVillage.tileId },
        body: {
          targetTileId: targetVillage.tileId,
          repeatCount: 3,
          resources: {
            wood: 100,
            clay: 50,
            iron: 25,
            wheat: 10,
          },
        },
      }),
    );

    const event = database.selectObject({
      sql: `
        SELECT
          JSON_EXTRACT(meta, '$.resources.wood') AS wood,
          JSON_EXTRACT(meta, '$.repeatRemaining') AS repeat_remaining,
          JSON_EXTRACT(meta, '$.repeatResources.wood') AS repeat_wood
        FROM events
        WHERE type = 'resourceTransfer';
      `,
      schema: z.strictObject({
        wood: resourcesSchema.shape.wood,
        repeat_remaining: z.number(),
        repeat_wood: resourcesSchema.shape.wood,
      }),
    })!;

    expect(event).toStrictEqual({
      wood: 100,
      repeat_remaining: 2,
      repeat_wood: 100,
    });
    expect(getVillageResources(database, sourceVillage.tileId)).toStrictEqual({
      wood: 700,
      clay: 750,
      iron: 775,
      wheat: 790,
    });
  });

  test('transferResources should reject when not enough free merchants are available', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(database, 'Merchant Target', {
      resourceSite: { updatedAt: NOW },
    });
    const { merchantCapacity } = merchantsMap.get(sourceVillage.tribe)!;

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 1, 32);
    setTestVillageResources(
      database,
      sourceVillage.tileId,
      {
        wood: merchantCapacity + 1,
        clay: 0,
        iron: 0,
        wheat: 0,
      },
      NOW,
    );

    expect(() =>
      transferResources(
        database,
        createControllerArgs<'/tiles/:tileId/transfer-resources', 'post'>({
          path: { tileId: sourceVillage.tileId },
          body: {
            targetTileId: targetVillage.tileId,
            resources: {
              wood: merchantCapacity + 1,
              clay: 0,
              iron: 0,
              wheat: 0,
            },
          },
        }),
      ),
    ).toThrow('Not enough free merchants');
  });

  test('transferResources should use trade office merchant capacity', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(
      database,
      'Trade Office Transfer Target',
      {
        resourceSite: { updatedAt: NOW },
      },
    );

    const baseMerchantCapacity = merchantsMap.get(
      sourceVillage.tribe,
    )!.merchantCapacity;

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 1, 32);
    setTradeOfficeLevel(database, sourceVillage.id, 2);
    setTestVillageResources(
      database,
      sourceVillage.tileId,
      {
        wood: baseMerchantCapacity + 1,
        clay: 0,
        iron: 0,
        wheat: 0,
      },
      NOW,
    );

    transferResources(
      database,
      createControllerArgs<'/tiles/:tileId/transfer-resources', 'post'>({
        path: { tileId: sourceVillage.tileId },
        body: {
          targetTileId: targetVillage.tileId,
          resources: {
            wood: baseMerchantCapacity + 1,
            clay: 0,
            iron: 0,
            wheat: 0,
          },
        },
      }),
    );

    const merchantAmount = database.selectValue({
      sql: `
        SELECT JSON_EXTRACT(meta, '$.merchantAmount')
        FROM events
        WHERE type = 'resourceTransfer';
      `,
      schema: z.number(),
    });

    expect(merchantAmount).toBe(1);
  });

  test('transferResources should reject when the source village has no marketplace', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(database, 'No Marketplace Target', {
      resourceSite: { updatedAt: NOW },
    });

    setTestVillageResources(
      database,
      sourceVillage.tileId,
      {
        wood: 100,
        clay: 100,
        iron: 100,
        wheat: 100,
      },
      NOW,
    );

    expect(() =>
      transferResources(
        database,
        createControllerArgs<'/tiles/:tileId/transfer-resources', 'post'>({
          path: { tileId: sourceVillage.tileId },
          body: {
            targetTileId: targetVillage.tileId,
            resources: { wood: 1, clay: 0, iron: 0, wheat: 0 },
          },
        }),
      ),
    ).toThrow('Not enough free merchants');
    expect(getResourceTransferCount(database)).toBe(0);
    expect(getVillageResources(database, sourceVillage.tileId)).toStrictEqual({
      wood: 100,
      clay: 100,
      iron: 100,
      wheat: 100,
    });
  });

  test('transferResources should count merchants already on the way', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(database, 'Busy Merchant Target', {
      resourceSite: { updatedAt: NOW },
    });

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 1, 32);
    setTestVillageResources(
      database,
      sourceVillage.tileId,
      {
        wood: 100,
        clay: 100,
        iron: 100,
        wheat: 100,
      },
      NOW,
    );

    database.exec({
      sql: `
        INSERT INTO events (type, starts_at, duration, village_id, meta)
        VALUES ('resourceTransfer', $now, 10000, $village_id, $meta);
      `,
      bind: {
        $now: NOW,
        $village_id: sourceVillage.id,
        $meta: JSON.stringify({
          originTileId: targetVillage.tileId,
          targetVillageId: sourceVillage.id,
          targetTileId: sourceVillage.tileId,
          resources: { wood: 1, clay: 0, iron: 0, wheat: 0 },
          merchantAmount: 1,
        }),
      },
    });

    expect(() =>
      transferResources(
        database,
        createControllerArgs<'/tiles/:tileId/transfer-resources', 'post'>({
          path: { tileId: sourceVillage.tileId },
          body: {
            targetTileId: targetVillage.tileId,
            resources: { wood: 1, clay: 0, iron: 0, wheat: 0 },
          },
        }),
      ),
    ).toThrow('Not enough free merchants');
  });

  test('transferResources should not count incoming merchants as occupied', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(
      database,
      'Incoming Merchant Target',
      {
        resourceSite: { updatedAt: NOW },
      },
    );

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 1, 32);
    setTestVillageResources(
      database,
      sourceVillage.tileId,
      {
        wood: 100,
        clay: 100,
        iron: 100,
        wheat: 100,
      },
      NOW,
    );

    database.exec({
      sql: `
        INSERT INTO events (type, starts_at, duration, village_id, meta)
        VALUES ('resourceTransfer', $now, 10000, $village_id, $meta);
      `,
      bind: {
        $now: NOW,
        $village_id: targetVillage.id,
        $meta: JSON.stringify({
          originTileId: targetVillage.tileId,
          targetVillageId: sourceVillage.id,
          targetTileId: sourceVillage.tileId,
          resources: { wood: 1, clay: 0, iron: 0, wheat: 0 },
          merchantAmount: 1,
        }),
      },
    });

    expect(() =>
      transferResources(
        database,
        createControllerArgs<'/tiles/:tileId/transfer-resources', 'post'>({
          path: { tileId: sourceVillage.tileId },
          body: {
            targetTileId: targetVillage.tileId,
            resources: { wood: 1, clay: 0, iron: 0, wheat: 0 },
          },
        }),
      ),
    ).not.toThrow();

    const outgoingTransferCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM events
        WHERE type = 'resourceTransfer'
          AND village_id = $village_id;
      `,
      bind: {
        $village_id: sourceVillage.id,
      },
      schema: z.number(),
    });

    expect(outgoingTransferCount).toBe(1);
  });

  test('transferResources should reject when source village does not have enough resources', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(database, 'Resource Target', {
      resourceSite: { updatedAt: NOW },
    });

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 10, 32);
    setTestVillageResources(
      database,
      sourceVillage.tileId,
      {
        wood: 10,
        clay: 10,
        iron: 10,
        wheat: 10,
      },
      NOW,
    );

    expect(() =>
      transferResources(
        database,
        createControllerArgs<'/tiles/:tileId/transfer-resources', 'post'>({
          path: { tileId: sourceVillage.tileId },
          body: {
            targetTileId: targetVillage.tileId,
            resources: { wood: 11, clay: 0, iron: 0, wheat: 0 },
          },
        }),
      ),
    ).toThrow('Not enough resources');
    expect(getResourceTransferCount(database)).toBe(0);
    expect(getVillageResources(database, sourceVillage.tileId)).toStrictEqual({
      wood: 10,
      clay: 10,
      iron: 10,
      wheat: 10,
    });
  });

  test('transferResources should reject missing target villages before creating events', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const missingVillageTileId = database.selectValue({
      sql: 'SELECT MAX(id) + 1 FROM tiles;',
      schema: z.number(),
    })!;

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 1, 32);
    setTestVillageResources(
      database,
      sourceVillage.tileId,
      {
        wood: 100,
        clay: 100,
        iron: 100,
        wheat: 100,
      },
      NOW,
    );

    expect(() =>
      transferResources(
        database,
        createControllerArgs<'/tiles/:tileId/transfer-resources', 'post'>({
          path: { tileId: sourceVillage.tileId },
          body: {
            targetTileId: missingVillageTileId,
            resources: { wood: 1, clay: 0, iron: 0, wheat: 0 },
          },
        }),
      ),
    ).toThrow('Target village does not exist');
    expect(getResourceTransferCount(database)).toBe(0);
    expect(getVillageResources(database, sourceVillage.tileId)).toStrictEqual({
      wood: 100,
      clay: 100,
      iron: 100,
      wheat: 100,
    });
  });

  test('transferResources should reject target villages not owned by the player', async () => {
    using database = await prepareTestDatabase();

    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const foreignVillageTileId = database.selectValue({
      sql: `
        SELECT tile_id
        FROM villages
        WHERE player_id != $player_id
        LIMIT 1;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: tileIdSchema,
    })!;

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 1, 32);

    expect(() =>
      transferResources(
        database,
        createControllerArgs<'/tiles/:tileId/transfer-resources', 'post'>({
          path: { tileId: sourceVillage.tileId },
          body: {
            targetTileId: foreignVillageTileId,
            resources: { wood: 1, clay: 0, iron: 0, wheat: 0 },
          },
        }),
      ),
    ).toThrow('Target village does not exist or does not belong to player');
  });

  test('createTradeRoute schedules an hourly route with omitted minutes without subtracting resources', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(database, 'Route Target', {
      resourceSite: { updatedAt: NOW },
    });
    const startHour = (new Date(NOW).getHours() + 1) % 24;

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 1, 32);
    setTestVillageResources(
      database,
      sourceVillage.tileId,
      {
        wood: 100,
        clay: 100,
        iron: 100,
        wheat: 100,
      },
      NOW,
    );

    createTradeRoute(
      database,
      createControllerArgs<'/tiles/:tileId/trade-routes', 'post'>({
        path: { tileId: sourceVillage.tileId },
        body: createTradeRouteBodySchema.parse({
          minimumMerchants: 0,
          minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
          targetTileId: targetVillage.tileId,
          startHour,
          intervalHours: 6,
          resources: {
            wood: 100,
            clay: 50,
            iron: 25,
            wheat: 10,
          },
        }),
      }),
    );

    const route = database.selectObject({
      sql: `
      SELECT
        e.starts_at,
        e.duration,
        e.village_id,
        r.target_village_id AS target_village_id,
        origin.tile_id AS origin_tile_id,
        target.tile_id AS target_tile_id,
        JSON_EXTRACT(r.resources, '$.wood') AS wood,
        JSON_EXTRACT(r.resources, '$.clay') AS clay,
        JSON_EXTRACT(r.resources, '$.iron') AS iron,
        JSON_EXTRACT(r.resources, '$.wheat') AS wheat,
        r.interval AS interval
      FROM events e
      JOIN trade_routes r ON r.id = JSON_EXTRACT(e.meta, '$.tradeRouteId')
      JOIN villages origin ON origin.id = r.village_id
      JOIN villages target ON target.id = r.target_village_id
      WHERE e.type = 'tradeRoute';
    `,
      schema: z.strictObject({
        starts_at: z.number(),
        duration: z.number(),
        village_id: z.number(),
        target_village_id: z.number(),
        origin_tile_id: tileIdSchema,
        target_tile_id: tileIdSchema,
        ...resourcesSchema.shape,
        interval: z.number(),
      }),
    })!;

    expect(route).toStrictEqual({
      starts_at: getNextStartAtForHour(NOW, startHour),
      duration: 0,
      village_id: sourceVillage.id,
      target_village_id: targetVillage.id,
      origin_tile_id: sourceVillage.tileId,
      target_tile_id: targetVillage.tileId,
      wood: 100,
      clay: 50,
      iron: 25,
      wheat: 10,
      interval: 6 * 60 * 60 * 1000,
    });
    expect(getVillageResources(database, sourceVillage.tileId)).toStrictEqual({
      wood: 100,
      clay: 100,
      iron: 100,
      wheat: 100,
    });
  });

  test('createTradeRoute schedules a mixed hour and minute interval later this hour without subtracting resources', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(database, 'Route Target', {
      resourceSite: { updatedAt: NOW },
    });
    const startHour = (new Date(NOW).getHours() + 0) % 24;

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 1, 32);
    setTestVillageResources(
      database,
      sourceVillage.tileId,
      {
        wood: 100,
        clay: 100,
        iron: 100,
        wheat: 100,
      },
      NOW,
    );

    createTradeRoute(
      database,
      createControllerArgs<'/tiles/:tileId/trade-routes', 'post'>({
        path: { tileId: sourceVillage.tileId },
        body: {
          targetTileId: targetVillage.tileId,
          startHour,
          startMinute: 30,
          intervalHours: 1,
          intervalMinutes: 30,
          minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
          minimumMerchants: 0,
          resources: {
            wood: 100,
            clay: 50,
            iron: 25,
            wheat: 10,
          },
        },
      }),
    );

    const route = database.selectObject({
      sql: `
      SELECT
        e.starts_at,
        e.duration,
        e.village_id,
        r.target_village_id AS target_village_id,
        origin.tile_id AS origin_tile_id,
        target.tile_id AS target_tile_id,
        JSON_EXTRACT(r.resources, '$.wood') AS wood,
        JSON_EXTRACT(r.resources, '$.clay') AS clay,
        JSON_EXTRACT(r.resources, '$.iron') AS iron,
        JSON_EXTRACT(r.resources, '$.wheat') AS wheat,
        r.interval AS interval
      FROM events e
      JOIN trade_routes r ON r.id = JSON_EXTRACT(e.meta, '$.tradeRouteId')
      JOIN villages origin ON origin.id = r.village_id
      JOIN villages target ON target.id = r.target_village_id
      WHERE e.type = 'tradeRoute';
    `,
      schema: z.strictObject({
        starts_at: z.number(),
        duration: z.number(),
        village_id: z.number(),
        target_village_id: z.number(),
        origin_tile_id: tileIdSchema,
        target_tile_id: tileIdSchema,
        ...resourcesSchema.shape,
        interval: z.number(),
      }),
    })!;

    expect(route).toStrictEqual({
      starts_at: getNextStartAtForHour(NOW, startHour, 30),
      duration: 0,
      village_id: sourceVillage.id,
      target_village_id: targetVillage.id,
      origin_tile_id: sourceVillage.tileId,
      target_tile_id: targetVillage.tileId,
      wood: 100,
      clay: 50,
      iron: 25,
      wheat: 10,
      interval: 90 * 60 * 1000,
    });
    expect(getVillageResources(database, sourceVillage.tileId)).toStrictEqual({
      wood: 100,
      clay: 100,
      iron: 100,
      wheat: 100,
    });
  });

  test('createTradeRoute schedules a minute-only interval tomorrow when the start time has passed without subtracting resources', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(database, 'Route Target', {
      resourceSite: { updatedAt: NOW },
    });
    const startHour = (new Date(NOW).getHours() + 0) % 24;

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 1, 32);
    setTestVillageResources(
      database,
      sourceVillage.tileId,
      {
        wood: 100,
        clay: 100,
        iron: 100,
        wheat: 100,
      },
      NOW,
    );

    createTradeRoute(
      database,
      createControllerArgs<'/tiles/:tileId/trade-routes', 'post'>({
        path: { tileId: sourceVillage.tileId },
        body: {
          targetTileId: targetVillage.tileId,
          startHour,
          startMinute: 5,
          intervalHours: 0,
          intervalMinutes: 15,
          minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
          minimumMerchants: 0,
          resources: {
            wood: 100,
            clay: 50,
            iron: 25,
            wheat: 10,
          },
        },
      }),
    );

    const route = database.selectObject({
      sql: `
      SELECT
        e.starts_at,
        e.duration,
        e.village_id,
        r.target_village_id AS target_village_id,
        origin.tile_id AS origin_tile_id,
        target.tile_id AS target_tile_id,
        JSON_EXTRACT(r.resources, '$.wood') AS wood,
        JSON_EXTRACT(r.resources, '$.clay') AS clay,
        JSON_EXTRACT(r.resources, '$.iron') AS iron,
        JSON_EXTRACT(r.resources, '$.wheat') AS wheat,
        r.interval AS interval
      FROM events e
      JOIN trade_routes r ON r.id = JSON_EXTRACT(e.meta, '$.tradeRouteId')
      JOIN villages origin ON origin.id = r.village_id
      JOIN villages target ON target.id = r.target_village_id
      WHERE e.type = 'tradeRoute';
    `,
      schema: z.strictObject({
        starts_at: z.number(),
        duration: z.number(),
        village_id: z.number(),
        target_village_id: z.number(),
        origin_tile_id: tileIdSchema,
        target_tile_id: tileIdSchema,
        ...resourcesSchema.shape,
        interval: z.number(),
      }),
    })!;

    expect(route).toStrictEqual({
      starts_at: getNextStartAtForHour(NOW, startHour, 5),
      duration: 0,
      village_id: sourceVillage.id,
      target_village_id: targetVillage.id,
      origin_tile_id: sourceVillage.tileId,
      target_tile_id: targetVillage.tileId,
      wood: 100,
      clay: 50,
      iron: 25,
      wheat: 10,
      interval: 15 * 60 * 1000,
    });
    expect(getVillageResources(database, sourceVillage.tileId)).toStrictEqual({
      wood: 100,
      clay: 100,
      iron: 100,
      wheat: 100,
    });
  });

  test('createTradeRoute should validate against trade office merchant capacity without storing merchant amount', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createTestVillage(
      database,
      'Trade Office Route Target',
      {
        resourceSite: { updatedAt: NOW },
      },
    );

    const startHour = (new Date(NOW).getHours() + 1) % 24;
    const baseMerchantCapacity = merchantsMap.get(
      sourceVillage.tribe,
    )!.merchantCapacity;

    setTestBuildingLevel(database, sourceVillage.id, 'MARKETPLACE', 1, 32);
    setTradeOfficeLevel(database, sourceVillage.id, 2);

    createTradeRoute(
      database,
      createControllerArgs<'/tiles/:tileId/trade-routes', 'post'>({
        path: { tileId: sourceVillage.tileId },
        body: {
          targetTileId: targetVillage.tileId,
          startHour,
          intervalHours: 6,
          startMinute: 0,
          intervalMinutes: 0,
          minimumResources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
          minimumMerchants: 0,
          resources: {
            wood: baseMerchantCapacity + 1,
            clay: 0,
            iron: 0,
            wheat: 0,
          },
        },
      }),
    );

    const merchantAmountType = database.selectValue({
      sql: `
        SELECT JSON_TYPE(meta, '$.merchantAmount')
        FROM events
        WHERE type = 'tradeRoute';
      `,
      schema: z.string().nullable(),
    });

    expect(merchantAmountType).toBeNull();
  });

  test('saved routes retain settings while paused and resume without duplicate or missed departures', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'DELETE FROM events;' });

    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const source = getPlayerVillage(database);
    const target = createTestVillage(database, 'Saved route target', {
      resourceSite: { updatedAt: NOW },
    });

    setTestBuildingLevel(database, source.id, 'MARKETPLACE', 2, 32);

    const body = {
      targetTileId: target.tileId,
      resources: { wood: 100, clay: 50, iron: 25, wheat: 10 },
      minimumResources: { wood: 1000, clay: 2000, iron: 3000, wheat: 4000 },
      minimumMerchants: 1,
      startHour: 3,
      startMinute: 0,
      intervalHours: 6,
      intervalMinutes: 0,
    };

    createTradeRoute(
      database,
      createControllerArgs<'/tiles/:tileId/trade-routes', 'post'>({
        path: { tileId: source.tileId },
        body,
      }),
    );

    const list = () =>
      listTradeRoutes(
        database,
        createControllerArgs<'/tiles/:tileId/trade-routes', 'get'>({
          path: { tileId: source.tileId },
        }),
      );

    const [original] = list();

    expect(original.paused).toBe(false);
    expect(original.minimumResources).toStrictEqual(body.minimumResources);
    expect(original.minimumMerchants).toBe(body.minimumMerchants);
    expect(original.nextAt).toBe(original.startsAt);

    const otherPlayerId = database.selectValue({
      sql: 'SELECT id FROM players WHERE id != $player_id LIMIT 1;',
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    })!;

    expect(
      listTradeRoutes(
        database,
        createControllerArgs<'/tiles/:tileId/trade-routes'>({
          context: { playerId: otherPlayerId },
          path: { tileId: source.tileId },
        }),
      ),
    ).toStrictEqual([]);
    expect(() =>
      createTradeRoute(
        database,
        createControllerArgs<'/tiles/:tileId/trade-routes', 'post'>({
          context: { playerId: otherPlayerId },
          path: { tileId: source.tileId },
          body,
        }),
      ),
    ).toThrow('Source village does not belong to player');

    const path = { routeId: original.id };

    expect(() =>
      updateTradeRoute(
        database,
        createControllerArgs<'/trade-routes/:routeId', 'patch'>({
          context: { playerId: otherPlayerId },
          path,
          body,
        }),
      ),
    ).toThrow('Trade route does not exist');

    const toggle = (paused: boolean) =>
      setTradeRoutePaused(
        database,
        createControllerArgs<'/trade-routes/:routeId/paused', 'patch'>({
          path,
          body: { paused },
        }),
      );

    const eventCount = () =>
      database.selectValue({
        sql: "SELECT COUNT(*) FROM events WHERE type = 'tradeRoute'",
        schema: z.number(),
      });

    expect(() =>
      updateTradeRoute(
        database,
        createControllerArgs<'/trade-routes/:routeId', 'patch'>({
          path,
          body: {
            ...body,
            resources: { wood: 10_000_000, clay: 0, iron: 0, wheat: 0 },
          },
        }),
      ),
    ).toThrow('Not enough merchants');

    expect(list()).toStrictEqual([original]);

    toggle(true);
    toggle(true);

    expect(eventCount()).toBe(0);
    expect(list()).toStrictEqual([{ ...original, paused: true, nextAt: null }]);

    expect(() =>
      setTradeRoutePaused(
        database,
        createControllerArgs<'/trade-routes/:routeId/paused', 'patch'>({
          path,
          context: { playerId: otherPlayerId },
          body: { paused: false },
        }),
      ),
    ).toThrow('Trade route does not exist');

    vi.setSystemTime(original.startsAt + 7 * 60 * 60 * 1000);
    toggle(false);
    toggle(false);

    expect(eventCount()).toBe(1);
    expect(list()[0].nextAt).toBe(original.startsAt + 12 * 60 * 60 * 1000);

    toggle(true);

    updateTradeRoute(
      database,
      createControllerArgs<'/trade-routes/:routeId', 'patch'>({
        path,
        body: {
          ...body,
          intervalHours: 12,
          intervalMinutes: 45,
          startMinute: 45,
          minimumResources: { wood: 500, clay: 600, iron: 700, wheat: 800 },
          minimumMerchants: 2,
        },
      }),
    );

    expect(eventCount()).toBe(0);
    expect(list()[0]).toMatchObject({
      id: original.id,
      paused: true,
      interval: (12 * 60 + 45) * 60 * 1000,
      startsAt: getNextStartAtForHour(Date.now(), body.startHour, 45),
      resources: body.resources,
      minimumResources: { wood: 500, clay: 600, iron: 700, wheat: 800 },
      minimumMerchants: 2,
    });

    toggle(false);

    expect(eventCount()).toBe(1);

    updateTradeRoute(
      database,
      createControllerArgs<'/trade-routes/:routeId', 'patch'>({
        path,
        body,
      }),
    );

    expect(eventCount()).toBe(1);

    expect(() =>
      deleteTradeRoute(
        database,
        createControllerArgs<'/trade-routes/:routeId', 'delete'>({
          path,
          context: { playerId: otherPlayerId },
        }),
      ),
    ).toThrow('Trade route does not exist');

    deleteTradeRoute(
      database,
      createControllerArgs<'/trade-routes/:routeId', 'delete'>({
        path,
      }),
    );

    expect(list()).toStrictEqual([]);
    expect(eventCount()).toBe(0);
  });
});
