import { afterEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { merchantsMap } from '@pillage-first/game-assets/merchants';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  calculateBuildingEffectValues,
  getBuildingDefinition,
} from '@pillage-first/game-assets/utils/buildings';
import { resourcesSchema } from '@pillage-first/types/models/resource';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { selectTribeByVillageId } from '../../../queries/village-queries';
import {
  createTradeRoute,
  deleteTradeRoute,
  transferResources,
  updateTradeRoute,
} from '../marketplace-controllers';
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
      tileId: z.number(),
      tribe: tribeSchema,
    }),
  })!;

const createPlayerVillage = (database: DbFacade, name: string) => {
  const tileId = database.selectValue({
    sql: `
      SELECT id
      FROM tiles
      WHERE type_id = (SELECT id FROM tile_type_ids WHERE type = 'free')
        AND id NOT IN (SELECT tile_id FROM villages)
      ORDER BY id
      LIMIT 1;
    `,
    schema: z.number(),
  })!;

  const villageId = database.selectValue({
    sql: `
      INSERT INTO villages (name, slug, tile_id, player_id)
      VALUES ($name, $slug, $tile_id, $player_id)
      RETURNING id;
    `,
    bind: {
      $name: name,
      $slug: `${name.toLowerCase().replaceAll(' ', '-')}-${tileId}`,
      $tile_id: tileId,
      $player_id: PLAYER_ID,
    },
    schema: z.number(),
  })!;

  database.exec({
    sql: `
      INSERT INTO resource_sites (tile_id, wood, clay, iron, wheat, updated_at)
      VALUES ($tile_id, 100, 100, 100, 100, $now)
      ON CONFLICT(tile_id) DO UPDATE SET
        wood = EXCLUDED.wood,
        clay = EXCLUDED.clay,
        iron = EXCLUDED.iron,
        wheat = EXCLUDED.wheat,
        updated_at = EXCLUDED.updated_at;
    `,
    bind: {
      $tile_id: tileId,
      $now: NOW,
    },
  });

  return {
    id: villageId,
    tileId,
  };
};

const setMarketplaceLevel = (
  database: DbFacade,
  villageId: number,
  level: number,
) => {
  database.exec({
    sql: `
      INSERT INTO building_fields (village_id, field_id, building_id, level)
      SELECT $village_id, 32, id, $level
      FROM building_ids
      WHERE building = 'MARKETPLACE'
      ON CONFLICT(village_id, field_id) DO UPDATE SET
        building_id = EXCLUDED.building_id,
        level = EXCLUDED.level;
    `,
    bind: {
      $village_id: villageId,
      $level: level,
    },
  });
};

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

  database.exec({
    sql: `
      INSERT INTO building_fields (village_id, field_id, building_id, level)
      SELECT $village_id, 37, id, $level
      FROM building_ids
      WHERE building = 'TRADE_OFFICE'
      ON CONFLICT(village_id, field_id) DO UPDATE SET
        building_id = EXCLUDED.building_id,
        level = EXCLUDED.level;
    `,
    bind: {
      $village_id: villageId,
      $level: level,
    },
  });

  database.exec({
    sql: `
      DELETE
      FROM effects
      WHERE village_id = $village_id
        AND source_specifier = 37
        AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building');
    `,
    bind: {
      $village_id: villageId,
    },
  });

  database.exec({
    sql: `
      INSERT INTO effects (effect_id, value, type_id, scope_id, source_id, village_id, source_specifier)
      VALUES (
        (SELECT id FROM effect_ids WHERE effect = 'merchantCapacity'),
        $value,
        (SELECT id FROM effect_type_ids WHERE type = 'bonus'),
        (SELECT id FROM effect_scope_ids WHERE scope = 'local'),
        (SELECT id FROM effect_source_ids WHERE source = 'building'),
        $village_id,
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

const setVillageResources = (
  database: DbFacade,
  tileId: number,
  resources: { wood: number; clay: number; iron: number; wheat: number },
) => {
  database.exec({
    sql: `
      INSERT INTO resource_sites (tile_id, wood, clay, iron, wheat, updated_at)
      VALUES ($tile_id, $wood, $clay, $iron, $wheat, $now)
      ON CONFLICT(tile_id) DO UPDATE SET
        wood = EXCLUDED.wood,
        clay = EXCLUDED.clay,
        iron = EXCLUDED.iron,
        wheat = EXCLUDED.wheat,
        updated_at = EXCLUDED.updated_at;
    `,
    bind: {
      $tile_id: tileId,
      $wood: resources.wood,
      $clay: resources.clay,
      $iron: resources.iron,
      $wheat: resources.wheat,
      $now: NOW,
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

const getNextStartAtForHour = (now: number, startHour: number) => {
  const startsAt = new Date(now);
  startsAt.setMinutes(0, 0, 0);
  startsAt.setHours(startHour);

  if (startsAt.getTime() <= now) {
    startsAt.setDate(startsAt.getDate() + 1);
  }

  return startsAt.getTime();
};

describe('marketplace-controllers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('transferResources should create a resource transfer and subtract source resources', async () => {
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createPlayerVillage(database, 'Transfer Target');

    setMarketplaceLevel(database, sourceVillage.id, 1);
    setVillageResources(database, sourceVillage.tileId, {
      wood: 1_000,
      clay: 1_000,
      iron: 1_000,
      wheat: 1_000,
    });

    transferResources(
      database,
      createControllerArgs<'/villages/:villageId/transfer-resources', 'post'>({
        path: { villageId: sourceVillage.id },
        body: {
          targetVillageId: targetVillage.id,
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
        origin_tile_id: z.number(),
        target_tile_id: z.number(),
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
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

  test('transferResources should reject when not enough free merchants are available', async () => {
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createPlayerVillage(database, 'Merchant Target');
    const merchantCapacity = merchantsMap.get(
      sourceVillage.tribe,
    )!.merchantCapacity;

    setMarketplaceLevel(database, sourceVillage.id, 1);
    setVillageResources(database, sourceVillage.tileId, {
      wood: merchantCapacity + 1,
      clay: 0,
      iron: 0,
      wheat: 0,
    });

    expect(() =>
      transferResources(
        database,
        createControllerArgs<'/villages/:villageId/transfer-resources', 'post'>(
          {
            path: { villageId: sourceVillage.id },
            body: {
              targetVillageId: targetVillage.id,
              resources: {
                wood: merchantCapacity + 1,
                clay: 0,
                iron: 0,
                wheat: 0,
              },
            },
          },
        ),
      ),
    ).toThrow('Not enough free merchants');
  });

  test('transferResources should use trade office merchant capacity', async () => {
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createPlayerVillage(
      database,
      'Trade Office Transfer Target',
    );
    const baseMerchantCapacity = merchantsMap.get(
      sourceVillage.tribe,
    )!.merchantCapacity;

    setMarketplaceLevel(database, sourceVillage.id, 1);
    setTradeOfficeLevel(database, sourceVillage.id, 2);
    setVillageResources(database, sourceVillage.tileId, {
      wood: baseMerchantCapacity + 1,
      clay: 0,
      iron: 0,
      wheat: 0,
    });

    transferResources(
      database,
      createControllerArgs<'/villages/:villageId/transfer-resources', 'post'>({
        path: { villageId: sourceVillage.id },
        body: {
          targetVillageId: targetVillage.id,
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
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createPlayerVillage(
      database,
      'No Marketplace Target',
    );

    setVillageResources(database, sourceVillage.tileId, {
      wood: 100,
      clay: 100,
      iron: 100,
      wheat: 100,
    });

    expect(() =>
      transferResources(
        database,
        createControllerArgs<'/villages/:villageId/transfer-resources', 'post'>(
          {
            path: { villageId: sourceVillage.id },
            body: {
              targetVillageId: targetVillage.id,
              resources: { wood: 1, clay: 0, iron: 0, wheat: 0 },
            },
          },
        ),
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
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createPlayerVillage(database, 'Busy Merchant Target');

    setMarketplaceLevel(database, sourceVillage.id, 1);
    setVillageResources(database, sourceVillage.tileId, {
      wood: 100,
      clay: 100,
      iron: 100,
      wheat: 100,
    });

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
          targetTileId: sourceVillage.tileId,
          targetVillageId: sourceVillage.id,
          resources: { wood: 1, clay: 0, iron: 0, wheat: 0 },
          merchantAmount: 1,
        }),
      },
    });

    expect(() =>
      transferResources(
        database,
        createControllerArgs<'/villages/:villageId/transfer-resources', 'post'>(
          {
            path: { villageId: sourceVillage.id },
            body: {
              targetVillageId: targetVillage.id,
              resources: { wood: 1, clay: 0, iron: 0, wheat: 0 },
            },
          },
        ),
      ),
    ).toThrow('Not enough free merchants');
  });

  test('transferResources should not count incoming merchants as occupied', async () => {
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createPlayerVillage(
      database,
      'Incoming Merchant Target',
    );

    setMarketplaceLevel(database, sourceVillage.id, 1);
    setVillageResources(database, sourceVillage.tileId, {
      wood: 100,
      clay: 100,
      iron: 100,
      wheat: 100,
    });

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
          targetTileId: sourceVillage.tileId,
          targetVillageId: sourceVillage.id,
          resources: { wood: 1, clay: 0, iron: 0, wheat: 0 },
          merchantAmount: 1,
        }),
      },
    });

    expect(() =>
      transferResources(
        database,
        createControllerArgs<'/villages/:villageId/transfer-resources', 'post'>(
          {
            path: { villageId: sourceVillage.id },
            body: {
              targetVillageId: targetVillage.id,
              resources: { wood: 1, clay: 0, iron: 0, wheat: 0 },
            },
          },
        ),
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
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createPlayerVillage(database, 'Resource Target');

    setMarketplaceLevel(database, sourceVillage.id, 10);
    setVillageResources(database, sourceVillage.tileId, {
      wood: 10,
      clay: 10,
      iron: 10,
      wheat: 10,
    });

    expect(() =>
      transferResources(
        database,
        createControllerArgs<'/villages/:villageId/transfer-resources', 'post'>(
          {
            path: { villageId: sourceVillage.id },
            body: {
              targetVillageId: targetVillage.id,
              resources: { wood: 11, clay: 0, iron: 0, wheat: 0 },
            },
          },
        ),
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
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const missingVillageId = database.selectValue({
      sql: 'SELECT MAX(id) + 1 FROM villages;',
      schema: z.number(),
    })!;

    setMarketplaceLevel(database, sourceVillage.id, 1);
    setVillageResources(database, sourceVillage.tileId, {
      wood: 100,
      clay: 100,
      iron: 100,
      wheat: 100,
    });

    expect(() =>
      transferResources(
        database,
        createControllerArgs<'/villages/:villageId/transfer-resources', 'post'>(
          {
            path: { villageId: sourceVillage.id },
            body: {
              targetVillageId: missingVillageId,
              resources: { wood: 1, clay: 0, iron: 0, wheat: 0 },
            },
          },
        ),
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
    const database = await prepareTestDatabase();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const foreignVillageId = database.selectValue({
      sql: `
        SELECT id
        FROM villages
        WHERE player_id != $player_id
        LIMIT 1;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    })!;

    setMarketplaceLevel(database, sourceVillage.id, 1);

    expect(() =>
      transferResources(
        database,
        createControllerArgs<'/villages/:villageId/transfer-resources', 'post'>(
          {
            path: { villageId: sourceVillage.id },
            body: {
              targetVillageId: foreignVillageId,
              resources: { wood: 1, clay: 0, iron: 0, wheat: 0 },
            },
          },
        ),
      ),
    ).toThrow('Target village does not exist or does not belong to player');
  });

  test('createTradeRoute should create a scheduled trade route without subtracting resources', async () => {
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createPlayerVillage(database, 'Route Target');
    const startHour = (new Date(NOW).getHours() + 1) % 24;

    setMarketplaceLevel(database, sourceVillage.id, 1);
    setVillageResources(database, sourceVillage.tileId, {
      wood: 100,
      clay: 100,
      iron: 100,
      wheat: 100,
    });

    createTradeRoute(
      database,
      createControllerArgs<'/villages/:villageId/trade-routes', 'post'>({
        path: { villageId: sourceVillage.id },
        body: {
          targetVillageId: targetVillage.id,
          startHour,
          intervalHours: 6,
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
          JSON_EXTRACT(meta, '$.interval') AS interval
        FROM events
        WHERE type = 'tradeRoute';
      `,
      schema: z.strictObject({
        starts_at: z.number(),
        duration: z.number(),
        village_id: z.number(),
        target_village_id: z.number(),
        origin_tile_id: z.number(),
        target_tile_id: z.number(),
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
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

  test('createTradeRoute should validate against trade office merchant capacity without storing merchant amount', async () => {
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createPlayerVillage(
      database,
      'Trade Office Route Target',
    );
    const startHour = (new Date(NOW).getHours() + 1) % 24;
    const baseMerchantCapacity = merchantsMap.get(
      sourceVillage.tribe,
    )!.merchantCapacity;

    setMarketplaceLevel(database, sourceVillage.id, 1);
    setTradeOfficeLevel(database, sourceVillage.id, 2);

    createTradeRoute(
      database,
      createControllerArgs<'/villages/:villageId/trade-routes', 'post'>({
        path: { villageId: sourceVillage.id },
        body: {
          targetVillageId: targetVillage.id,
          startHour,
          intervalHours: 6,
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

  test('deleteTradeRoute should remove the scheduled trade route event', async () => {
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events;' });

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createPlayerVillage(database, 'Delete Route Target');

    const eventId = database.selectValue({
      sql: `
        INSERT INTO events (type, starts_at, duration, village_id, meta)
        VALUES ('tradeRoute', $starts_at, 0, $village_id, $meta)
        RETURNING id;
      `,
      bind: {
        $starts_at: NOW,
        $village_id: sourceVillage.id,
        $meta: JSON.stringify({
          targetVillageId: targetVillage.id,
          originTileId: sourceVillage.tileId,
          targetTileId: targetVillage.tileId,
          resources: { wood: 1, clay: 0, iron: 0, wheat: 0 },
          interval: 60 * 60 * 1000,
        }),
      },
      schema: z.number(),
    })!;

    deleteTradeRoute(
      database,
      createControllerArgs<
        '/villages/:villageId/trade-routes/:eventId',
        'delete'
      >({
        path: {
          villageId: sourceVillage.id,
          eventId,
        },
      }),
    );

    expect(
      database.selectValue({
        sql: "SELECT COUNT(*) FROM events WHERE type = 'tradeRoute';",
        schema: z.number(),
      }),
    ).toBe(0);
  });

  test('updateTradeRoute should replace the scheduled trade route event payload', async () => {
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const firstTargetVillage = createPlayerVillage(
      database,
      'Original Route Target',
    );
    const updatedTargetVillage = createPlayerVillage(
      database,
      'Updated Route Target',
    );
    const startHour = (new Date(NOW).getHours() + 2) % 24;

    setMarketplaceLevel(database, sourceVillage.id, 2);

    const eventId = database.selectValue({
      sql: `
        INSERT INTO events (type, starts_at, duration, village_id, meta)
        VALUES ('tradeRoute', $starts_at, 0, $village_id, $meta)
        RETURNING id;
      `,
      bind: {
        $starts_at: NOW,
        $village_id: sourceVillage.id,
        $meta: JSON.stringify({
          targetVillageId: firstTargetVillage.id,
          originTileId: sourceVillage.tileId,
          targetTileId: firstTargetVillage.tileId,
          resources: { wood: 1, clay: 0, iron: 0, wheat: 0 },
          interval: 60 * 60 * 1000,
        }),
      },
      schema: z.number(),
    })!;

    updateTradeRoute(
      database,
      createControllerArgs<
        '/villages/:villageId/trade-routes/:eventId',
        'patch'
      >({
        path: {
          villageId: sourceVillage.id,
          eventId,
        },
        body: {
          targetVillageId: updatedTargetVillage.id,
          startHour,
          intervalHours: 12,
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
          JSON_EXTRACT(meta, '$.interval') AS interval
        FROM events
        WHERE type = 'tradeRoute';
      `,
      schema: z.strictObject({
        starts_at: z.number(),
        duration: z.number(),
        village_id: z.number(),
        target_village_id: z.number(),
        origin_tile_id: z.number(),
        target_tile_id: z.number(),
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
        interval: z.number(),
      }),
    })!;

    expect(route).toStrictEqual({
      starts_at: getNextStartAtForHour(NOW, startHour),
      duration: 0,
      village_id: sourceVillage.id,
      target_village_id: updatedTargetVillage.id,
      origin_tile_id: sourceVillage.tileId,
      target_tile_id: updatedTargetVillage.tileId,
      wood: 100,
      clay: 50,
      iron: 25,
      wheat: 10,
      interval: 12 * 60 * 60 * 1000,
    });
    expect(
      database.selectValue({
        sql: "SELECT COUNT(*) FROM events WHERE type = 'tradeRoute';",
        schema: z.number(),
      }),
    ).toBe(1);
  });
});
