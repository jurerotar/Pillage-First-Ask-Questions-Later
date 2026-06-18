import { afterEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { resolveEvent } from '../../resolve-event';

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
      tile_id: z.number(),
    }),
  })!;

const createPlayerVillage = (
  database: Awaited<ReturnType<typeof prepareTestDatabase>>,
  name: string,
) => {
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

const setVillageResources = (
  database: Awaited<ReturnType<typeof prepareTestDatabase>>,
  tileId: number,
  resources: { wood: number; clay: number; iron: number; wheat: number },
  updatedAt = NOW,
) => {
  database.exec({
    sql: `
      INSERT INTO resource_sites (tile_id, wood, clay, iron, wheat, updated_at)
      VALUES ($tile_id, $wood, $clay, $iron, $wheat, $updated_at)
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
      $updated_at: updatedAt,
    },
  });
};

const getVillageResources = (
  database: Awaited<ReturnType<typeof prepareTestDatabase>>,
  tileId: number,
) =>
  database.selectObject({
    sql: 'SELECT wood, clay, iron, wheat FROM resource_sites WHERE tile_id = $tile_id;',
    bind: { $tile_id: tileId },
    schema: z.strictObject({
      wood: z.number(),
      clay: z.number(),
      iron: z.number(),
      wheat: z.number(),
    }),
  })!;

const insertMarketplaceEvent = (
  database: Awaited<ReturnType<typeof prepareTestDatabase>>,
  args: {
    type: 'resourceTransfer';
    villageId: number;
    targetVillageId: number;
    originTileId: number;
    targetTileId: number;
    startsAt: number;
    duration: number;
    merchantAmount: number;
    resources?: { wood: number; clay: number; iron: number; wheat: number };
  },
) =>
  database.selectValue({
    sql: `
      INSERT INTO events (type, starts_at, duration, village_id, meta)
      VALUES ($type, $starts_at, $duration, $village_id, $meta)
      RETURNING id;
    `,
    bind: {
      $type: args.type,
      $starts_at: args.startsAt,
      $duration: args.duration,
      $village_id: args.villageId,
      $meta: JSON.stringify({
        targetVillageId: args.targetVillageId,
        originTileId: args.originTileId,
        targetTileId: args.targetTileId,
        resources: args.resources ?? {
          wood: 100,
          clay: 50,
          iron: 25,
          wheat: 10,
        },
        merchantAmount: args.merchantAmount,
      }),
    },
    schema: z.number(),
  })!;

describe('marketplace resolvers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('resourceTransfer should add resources to target and create a zero-resource return transfer', async () => {
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events;' });
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createPlayerVillage(database, 'Resolver Target');

    const resolvesAt = NOW + 5_000;
    setVillageResources(
      database,
      targetVillage.tileId,
      { wood: 200, clay: 200, iron: 200, wheat: 200 },
      resolvesAt,
    );

    const eventId = insertMarketplaceEvent(database, {
      type: 'resourceTransfer',
      villageId: sourceVillage.id,
      targetVillageId: targetVillage.id,
      originTileId: sourceVillage.tile_id,
      targetTileId: targetVillage.tileId,
      startsAt: NOW,
      duration: 5_000,
      merchantAmount: 1,
    });

    resolveEvent(database, eventId);

    expect(getVillageResources(database, targetVillage.tileId)).toStrictEqual({
      wood: 300,
      clay: 250,
      iron: 225,
      wheat: 210,
    });

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
        origin_tile_id: z.number(),
        target_tile_id: z.number(),
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
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
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events;' });

    const sourceVillage = getPlayerVillage(database);
    const targetVillage = createPlayerVillage(database, 'Noop Return Target');

    setVillageResources(database, sourceVillage.tile_id, {
      wood: 500,
      clay: 500,
      iron: 500,
      wheat: 500,
    });

    const eventId = insertMarketplaceEvent(database, {
      type: 'resourceTransfer',
      villageId: sourceVillage.id,
      targetVillageId: sourceVillage.id,
      originTileId: targetVillage.tileId,
      targetTileId: sourceVillage.tile_id,
      startsAt: NOW,
      duration: 5_000,
      merchantAmount: 1,
      resources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
    });

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
});
