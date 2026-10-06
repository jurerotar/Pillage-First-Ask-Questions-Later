import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { getSerializedServerDatabase, getServer } from '../server-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('server-controllers', () => {
  test('getServer should return server details', async () => {
    const database = await prepareTestDatabase();

    const result = getServer(database, createControllerArgs<'/server'>({}));
    const storedServer = database.selectObject({
      sql: `
        SELECT id, version, name, slug, created_at, seed, map_size, speed,
          player_name, player_tribe
        FROM servers;
      `,
      schema: z.strictObject({
        id: z.string(),
        version: z.string(),
        name: z.string(),
        slug: z.string(),
        created_at: z.number(),
        seed: z.string(),
        map_size: z.number(),
        speed: z.number(),
        player_name: z.string(),
        player_tribe: z.string(),
      }),
    })!;

    expect(result).toMatchObject({
      id: storedServer.id,
      version: storedServer.version,
      name: storedServer.name,
      slug: storedServer.slug,
      createdAt: storedServer.created_at,
      seed: storedServer.seed,
      configuration: {
        mapSize: storedServer.map_size,
        speed: storedServer.speed,
      },
      playerConfiguration: {
        name: storedServer.player_name,
        tribe: storedServer.player_tribe,
      },
    });
  });

  test('getSerializedServerDatabase should snapshot the active database', async () => {
    const database = await prepareTestDatabase();

    const snapshot = getSerializedServerDatabase(
      database,
      createControllerArgs<'/server/database'>({}),
    );

    expect(snapshot).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(snapshot.subarray(0, 16))).toBe(
      'SQLite format 3\u0000',
    );
    expect(
      getServer(database, createControllerArgs<'/server'>({})),
    ).toMatchObject({
      id: expect.any(String),
    });
  });
});
