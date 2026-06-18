import { afterEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { merchantsMap } from '@pillage-first/game-assets/merchants';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { transferResources } from '../marketplace-controllers';
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
      WHERE type = 'free'
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
    schema: z.strictObject({
      wood: z.number(),
      clay: z.number(),
      iron: z.number(),
      wheat: z.number(),
    }),
  })!;

const getResourceTransferCount = (database: DbFacade) =>
  database.selectValue({
    sql: "SELECT COUNT(*) FROM events WHERE type = 'resourceTransfer';",
    schema: z.number(),
  })!;

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
});
