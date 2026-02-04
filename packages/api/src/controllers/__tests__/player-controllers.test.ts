import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  getMe,
  getPlayerBySlug,
  getPlayerVillageListing,
  getPlayerVillagesWithPopulation,
  getTroopsByVillage,
  type RenameVillageBody,
  renameVillage,
} from '../player-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('player-controllers', () => {
  const playerId = PLAYER_ID;

  test('getMe should return current player details', async () => {
    const database = await prepareTestDatabase();

    getMe(database, createControllerArgs<'/players/me'>({}));

    expect(true).toBeTruthy();
  });

  test('getPlayerVillageListing should return village listing for a player', async () => {
    const database = await prepareTestDatabase();

    const result = await getPlayerVillageListing(
      database,
      createControllerArgs<'/players/:playerId/villages'>({
        params: { playerId },
      }),
    ) as any[];

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('tileId');
    expect(result[0]).toHaveProperty('coordinates');
    expect(result[0].coordinates).toHaveProperty('x');
    expect(result[0].coordinates).toHaveProperty('y');
    expect(result[0]).toHaveProperty('resourceFieldComposition');
  });

  test('getPlayerVillagesWithPopulation should return villages with population', async () => {
    const database = await prepareTestDatabase();

    const result = await getPlayerVillagesWithPopulation(
      database,
      createControllerArgs<'/players/:playerId/villages-with-population'>({
        params: { playerId },
      }),
    ) as any[];

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('population');
    expect(result[0]).toHaveProperty('coordinates');
  });

  test('getTroopsByVillage should return troops by village for a player', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages WHERE player_id = $player_id LIMIT 1',
      bind: { $player_id: playerId },
      schema: z.object({ id: z.number() }),
    })!;

    getTroopsByVillage(
      database,
      createControllerArgs<'/villages/:villageId/troops'>({
        params: { playerId, villageId: village.id },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('renameVillage should rename a village', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages WHERE player_id = $player_id LIMIT 1',
      bind: { $player_id: playerId },
      schema: z.object({ id: z.number() }),
    })!;

    renameVillage(
      database,
      createControllerArgs<
        '/villages/:villageId/rename',
        'patch',
        RenameVillageBody
      >({
        params: { villageId: village.id },
        body: { name: 'New Village Name' },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getPlayerBySlug should return player details by slug', async () => {
    const database = await prepareTestDatabase();

    const player = database.selectObject({
      sql: 'SELECT slug FROM players WHERE id = $player_id',
      bind: { $player_id: playerId },
      schema: z.object({ slug: z.string() }),
    })!;

    const result = await getPlayerBySlug(
      database,
      createControllerArgs<'/players/:playerSlug'>({
        params: { playerSlug: player.slug },
      }),
    ) as any;

    expect(result).toBeDefined();
    expect(result.slug).toBe(player.slug);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
  });
});
