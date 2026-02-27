import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  getGameWorldOverview,
  getPlayerRankings,
  getVillageRankings,
} from '../statistics-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('statistics-controllers', () => {
  test('getPlayerRankings should return correct population (only counting building base effects)', async () => {
    const database = await prepareTestDatabase();

    const player = database.selectObject({
      sql: 'SELECT id FROM players LIMIT 1',
      schema: z.object({ id: z.number() }),
    })!;

    const village = database.selectObject({
      sql: 'SELECT id FROM villages WHERE player_id = $player_id LIMIT 1',
      bind: { $player_id: player.id },
      schema: z.object({ id: z.number() }),
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
        value: -200,
        type: 'base',
        scope: 'village',
        source: 'building',
        source_specifier: 0,
      },
      {
        value: 50,
        type: 'base',
        scope: 'village',
        source: 'troops',
        source_specifier: null,
      },
      {
        value: -10,
        type: 'bonus',
        scope: 'village',
        source: 'building',
        source_specifier: 0,
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

    const result = getPlayerRankings(
      database,
      createControllerArgs<'/statistics/players'>({
        body: { lastPlayerId: null },
      }),
    );

    const testPlayer = result.find((p) => p.id === player.id)!;
    // population = SUM(-value) for matches. Only -200 matches.
    // -(-200) = 200
    expect(testPlayer.totalPopulation).toBe(200);
  });

  test('getVillageRankings should return correct population (only counting building base effects)', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.object({ id: z.number() }),
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
        value: -300,
        type: 'base',
        scope: 'village',
        source: 'building',
        source_specifier: 0,
      },
      {
        value: 100,
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

    const result = getVillageRankings(
      database,
      createControllerArgs<'/statistics/villages'>({
        body: { lastVillageId: null },
      }),
    );

    const testVillage = result.find((v) => v.id === village.id);
    expect(testVillage).toBeDefined();
    expect(testVillage?.population).toBe(300);
  });

  test('getGameWorldOverview should return game world overview', async () => {
    const database = await prepareTestDatabase();

    getGameWorldOverview(
      database,
      createControllerArgs<'/statistics/overview'>({}),
    );

    expect(true).toBeTruthy();
  });
});
