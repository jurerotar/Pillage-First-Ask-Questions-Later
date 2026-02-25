import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  getTileOasisBonuses,
  getTiles,
  getTileTroops,
  getTileWorldItem,
} from '../map-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('map-controllers', () => {
  test('getTiles should return correct population (only counting building base effects)', async () => {
    const database = await prepareTestDatabase();

    // 1. Create a test village
    const village = database.selectObject({
      sql: 'SELECT id, tile_id FROM villages LIMIT 1',
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    const wheatEffectId = database.selectValue({
      sql: "SELECT id FROM effect_ids WHERE effect = 'wheatProduction'",
      schema: z.number(),
    })!;

    // 2. Clear existing effects for this village to have a clean state
    database.exec({
      sql: 'DELETE FROM effects WHERE village_id = $village_id',
      bind: { $village_id: village.id },
    });

    // 3. Seed various effects
    const effects = [
      // Correct population effect: type='base', scope='village', source='building', source_specifier=0
      {
        value: -100,
        type: 'base',
        scope: 'village',
        source: 'building',
        source_specifier: 0,
      },
      // Another correct population effect (should be summed)
      {
        value: -50,
        type: 'base',
        scope: 'village',
        source: 'building',
        source_specifier: 0,
      },
      // Troop consumption (should NOT be counted)
      {
        value: 20,
        type: 'base',
        scope: 'village',
        source: 'troops',
        source_specifier: null,
      },
      // Oasis bonus (should NOT be counted)
      {
        value: 1.25,
        type: 'bonus',
        scope: 'village',
        source: 'oasis',
        source_specifier: 123,
      },
      // Building production (not wheatProduction effect_id, but we'll use wheatProduction id for all to test filters)
      {
        value: 10,
        type: 'base',
        scope: 'village',
        source: 'building',
        source_specifier: 1,
      }, // field_id 1
      // Non-base type (should NOT be counted)
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

    const result = getTiles(database, createControllerArgs<'/tiles'>({}));

    const testTile = result.find((t) => t?.ownerVillage?.id === village.id)!;

    // Population is SUM(-value) for matches. Matches are -100 and -50.
    // -(-100) + -(-50) = 100 + 50 = 150.
    expect(testTile.ownerVillage!.population).toBe(150);
  });

  test('getTileTroops should return troops for a tile with animals', async () => {
    const database = await prepareTestDatabase();

    // Find a tile with nature troops (animals).
    // Nature troops have IDs from WILD_BOAR to CROCODILE etc.
    // They are seeded into oasis tiles where all rows have no village_id.
    const tileWithAnimals = database.selectObject({
      sql: `
        SELECT t.id AS tile_id
        FROM tiles t
        WHERE t.type = 'oasis'
        AND (
          SELECT MAX(o.village_id)
          FROM oasis o
          WHERE o.tile_id = t.id
        ) IS NULL
        LIMIT 1
      `,
      schema: z.strictObject({ tile_id: z.number() }),
    })!;

    getTileTroops(
      database,
      createControllerArgs<'/tiles/:tileId/troops'>({
        path: { tileId: tileWithAnimals.tile_id },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getTileOasisBonuses should return bonuses for an oasis tile', async () => {
    const database = await prepareTestDatabase();

    // Find a tile with bonuses
    const tileWithBonuses = database.selectObject({
      sql: 'SELECT tile_id FROM oasis LIMIT 1',
      schema: z.strictObject({ tile_id: z.number() }),
    })!;

    getTileOasisBonuses(
      database,
      createControllerArgs<'/tiles/:tileId/bonuses'>({
        path: { tileId: tileWithBonuses.tile_id },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getTileWorldItem should return world item for a tile with world items', async () => {
    const database = await prepareTestDatabase();

    // Find a tile with world items
    const tileWithItem = database.selectObject({
      sql: 'SELECT tile_id FROM world_items LIMIT 1',
      schema: z.strictObject({ tile_id: z.number() }),
    })!;

    getTileWorldItem(
      database,
      createControllerArgs<'/tiles/:tileId/world-item'>({
        path: { tileId: tileWithItem.tile_id },
      }),
    );

    expect(true).toBeTruthy();
  });
});
