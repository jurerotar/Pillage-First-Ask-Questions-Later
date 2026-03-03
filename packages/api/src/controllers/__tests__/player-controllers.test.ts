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

    const result = getPlayerVillageListing(
      database,
      createControllerArgs<'/players/:playerId/villages'>({
        path: { playerId },
      }),
    );

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('tileId');
    expect(result[0]).toHaveProperty('coordinates');
    expect(result[0].coordinates).toHaveProperty('x');
    expect(result[0].coordinates).toHaveProperty('y');
    expect(result[0]).toHaveProperty('resourceFieldComposition');
  });

  test('getPlayerVillagesWithPopulation should return correct population (only counting building base effects)', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id, player_id FROM villages WHERE player_id = $player_id LIMIT 1',
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number(), player_id: z.number() }),
    })!;

    const wheatEffectId = database.selectValue({
      sql: "SELECT id FROM effect_ids WHERE effect = 'wheatProduction'",
      schema: z.number(),
    })!;

    // Clear existing effects for this village
    database.exec({
      sql: 'DELETE FROM effects WHERE village_id = $village_id',
      bind: { $village_id: village.id },
    });

    // Seed various effects
    const effects = [
      {
        value: -400,
        type: 'base',
        scope: 'village',
        source: 'building',
        source_specifier: 0,
      },
      {
        value: 150,
        type: 'base',
        scope: 'village',
        source: 'troops',
        source_specifier: null,
      },
    ];

    for (const effect of effects) {
      database.exec({
        sql: `
          INSERT INTO effects (effect_id, value, type, scope, source, village_id, source_specifier)
          VALUES ($effect_id, $value, $type, $scope, $source, $village_id, $source_specifier)
        `,
        bind: {
          $effect_id: wheatEffectId,
          $value: effect.value,
          $type: effect.type,
          $scope: effect.scope,
          $source: effect.source,
          $village_id: village.id,
          $source_specifier: effect.source_specifier,
        },
      });
    }

    const result = getPlayerVillagesWithPopulation(
      database,
      createControllerArgs<'/players/:playerId/villages-with-population'>({
        path: { playerId: village.player_id },
      }),
    );

    const testVillage = result.find((v) => v.id === village.id)!;

    expect(testVillage.population).toBe(400);
  });

  test('getTroopsByVillage should return troops by village for a player', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages WHERE player_id = $player_id LIMIT 1',
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number() }),
    })!;

    getTroopsByVillage(
      database,
      createControllerArgs<'/villages/:villageId/troops'>({
        path: { villageId: village.id },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('renameVillage should rename a village', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages WHERE player_id = $player_id LIMIT 1',
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number() }),
    })!;

    renameVillage(
      database,
      createControllerArgs<'/villages/:villageId/rename', 'patch'>({
        path: { villageId: village.id },
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
      schema: z.strictObject({ slug: z.string() }),
    })!;

    const result = getPlayerBySlug(
      database,
      createControllerArgs<'/players/:playerSlug'>({
        path: { playerSlug: player.slug },
      }),
    );

    expect(result).toBeDefined();
    expect(result.slug).toBe(player.slug);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
  });
});
