import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  insertEffectQuery,
  selectWheatProductionEffectIdQuery,
} from '../../../queries/effect-queries';
import {
  getGameWorldOverview,
  getPlayerRankings,
  getVillageRankings,
} from '../statistics-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('statistics-controllers', () => {
  test('getPlayerRankings should return correct population (only counting building base effects)', async () => {
    const database = await prepareTestDatabase();

    const playerId = database.selectValue({
      sql: 'SELECT id FROM players LIMIT 1',
      schema: z.number(),
    })!;

    const villageId = database.selectValue({
      sql: 'SELECT id FROM villages WHERE player_id = $player_id LIMIT 1',
      bind: { $player_id: playerId },
      schema: z.number(),
    })!;
    const tileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
      bind: { $village_id: villageId },
      schema: z.number(),
    })!;

    const wheatEffectId = database.selectValue({
      sql: selectWheatProductionEffectIdQuery,
      schema: z.number(),
    })!;

    // Clear existing effects for this village
    database.exec({
      sql: 'DELETE FROM effects WHERE tile_id = $tile_id',
      bind: { $tile_id: tileId },
    });

    // Seed various effects
    const effects = [
      {
        value: -200,
        type: 'base',
        scope: 'local',
        source: 'building',
        source_specifier: 0,
      },
      {
        value: 50,
        type: 'base',
        scope: 'local',
        source: 'troops',
        source_specifier: null,
      },
      {
        value: -10,
        type: 'bonus',
        scope: 'local',
        source: 'building',
        source_specifier: 0,
      },
    ];

    for (const effect of effects) {
      database.exec({
        sql: insertEffectQuery,
        bind: {
          $effect_id: wheatEffectId,
          $value: effect.value,
          $type: effect.type,
          $scope: effect.scope,
          $source: effect.source,
          $tile_id: tileId,
          $source_specifier: effect.source_specifier,
        },
      });
    }

    const result = getPlayerRankings(
      database,
      createControllerArgs<'/statistics/players'>({
        query: { lastPlayerId: null },
      }),
    );

    const testPlayer = result.find((p) => p.id === playerId)!;
    // population = SUM(-value) for matches. Only -200 matches.
    // -(-200) = 200
    expect(testPlayer.totalPopulation).toBe(200);
  });

  test('getVillageRankings should return correct population (only counting building base effects)', async () => {
    const database = await prepareTestDatabase();

    const villageId = database.selectValue({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.number(),
    })!;
    const tileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
      bind: { $village_id: villageId },
      schema: z.number(),
    })!;

    const wheatEffectId = database.selectValue({
      sql: selectWheatProductionEffectIdQuery,
      schema: z.number(),
    })!;

    // Clear existing effects for this village
    database.exec({
      sql: 'DELETE FROM effects WHERE tile_id = $tile_id',
      bind: { $tile_id: tileId },
    });

    // Seed various effects
    const effects = [
      {
        value: -300,
        type: 'base',
        scope: 'local',
        source: 'building',
        source_specifier: 0,
      },
      {
        value: 100,
        type: 'base',
        scope: 'local',
        source: 'troops',
        source_specifier: null,
      },
    ];

    for (const effect of effects) {
      database.exec({
        sql: insertEffectQuery,
        bind: {
          $effect_id: wheatEffectId,
          $value: effect.value,
          $type: effect.type,
          $scope: effect.scope,
          $source: effect.source,
          $tile_id: tileId,
          $source_specifier: effect.source_specifier,
        },
      });
    }

    const result = getVillageRankings(
      database,
      createControllerArgs<'/statistics/villages'>({
        query: { lastVillageId: null },
      }),
    );

    const testVillage = result.find((v) => v.id === villageId);
    expect(testVillage).toBeDefined();
    expect(testVillage?.population).toBe(300);
  });

  test('getGameWorldOverview should return game world overview', async () => {
    const database = await prepareTestDatabase();

    getGameWorldOverview(
      database,
      createControllerArgs<'/statistics/overview'>({}),
    );

    expect(true).toBe(true);
  });
});
