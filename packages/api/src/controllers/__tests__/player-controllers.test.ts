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

    getPlayerVillageListing(
      database,
      createControllerArgs<'/players/:playerId/villages'>({
        params: { playerId },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getPlayerVillagesWithPopulation should return villages with population', async () => {
    const database = await prepareTestDatabase();

    getPlayerVillagesWithPopulation(
      database,
      createControllerArgs<'/players/:playerId/villages-with-population'>({
        params: { playerId },
      }),
    );

    expect(true).toBeTruthy();
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
        { name: string }
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

    getPlayerBySlug(
      database,
      createControllerArgs<'/players/:playerSlug'>({
        params: { playerSlug: player.slug },
      }),
    );

    expect(true).toBeTruthy();
  });
});
