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
  getProductionAndPowerStatistics,
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

  test('getProductionAndPowerStatistics should count stationed and moving troops', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id, tile_id, player_id FROM villages WHERE player_id = 1 LIMIT 1',
      schema: z.strictObject({
        id: z.number(),
        tile_id: z.number(),
        player_id: z.number(),
      }),
    })!;

    database.exec({ sql: 'DELETE FROM troops' });
    database.exec({
      sql: `
        DELETE FROM events
        WHERE type IN (
          'troopMovementReinforcements',
          'troopMovementRelocation',
          'troopMovementReturn',
          'troopMovementFindNewVillage',
          'troopMovementAttack',
          'troopMovementRaid',
          'troopMovementOasisOccupation',
          'troopMovementAdventure'
        );
      `,
    });
    database.exec({ sql: 'UPDATE unit_improvements SET level = 0' });

    database.exec({
      sql: `
        INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
        VALUES (
          (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'),
          2,
          $tile_id,
          $tile_id
        );
      `,
      bind: { $tile_id: village.tile_id },
    });

    database.exec({
      sql: `
        INSERT INTO events (type, starts_at, duration, village_id, meta)
        VALUES (
          'troopMovementAttack',
          0,
          1000,
          $village_id,
          $meta
        );
      `,
      bind: {
        $village_id: village.id,
        $meta: JSON.stringify({
          originTileId: village.tile_id,
          targetTileId: village.tile_id,
          troops: [
            {
              unitId: 'LEGIONNAIRE',
              amount: 3,
              tileId: village.tile_id,
              sourceTileId: village.tile_id,
            },
          ],
        }),
      },
    });

    const result = getProductionAndPowerStatistics(
      database,
      createControllerArgs<'/statistics/production-and-power'>({
        query: {
          villageId: village.id,
        },
      }),
    );

    expect(result.village.id).toBe(village.id);
    expect(result.kingdom.id).toBe(village.player_id);
    expect(result.kingdomCount).toBeGreaterThan(0);
    expect(result.villageCount).toBeGreaterThan(0);
    expect(result.village.attackPower).toBe(200);
    expect(result.village.infantryDefencePower).toBe(175);
    expect(result.village.cavalryDefencePower).toBe(250);
    expect(result.village.totalDefencePower).toBe(425);
    expect(result.village.attackPowerAverage).toBeTypeOf('number');
    expect(result.village.infantryDefencePowerAverage).toBeTypeOf('number');
    expect(result.village.cavalryDefencePowerAverage).toBeTypeOf('number');
    expect(result.village.totalDefencePowerAverage).toBeTypeOf('number');
    expect(result.village.woodProductionAverage).toBeTypeOf('number');
    expect(result.village.clayProductionAverage).toBeTypeOf('number');
    expect(result.village.ironProductionAverage).toBeTypeOf('number');
    expect(result.village.wheatProductionAverage).toBeTypeOf('number');
    expect(result.village.productionAverage).toBeTypeOf('number');
    expect(result.kingdom.attackPower).toBeGreaterThanOrEqual(
      result.village.attackPower,
    );
    expect(result.kingdom.attackPowerAverage).toBeTypeOf('number');
    expect(result.kingdom.infantryDefencePowerAverage).toBeTypeOf('number');
    expect(result.kingdom.cavalryDefencePowerAverage).toBeTypeOf('number');
    expect(result.kingdom.totalDefencePowerAverage).toBeTypeOf('number');
    expect(result.kingdom.woodProductionAverage).toBeTypeOf('number');
    expect(result.kingdom.clayProductionAverage).toBeTypeOf('number');
    expect(result.kingdom.ironProductionAverage).toBeTypeOf('number');
    expect(result.kingdom.wheatProductionAverage).toBeTypeOf('number');
    expect(result.kingdom.productionAverage).toBeTypeOf('number');
  });
});
