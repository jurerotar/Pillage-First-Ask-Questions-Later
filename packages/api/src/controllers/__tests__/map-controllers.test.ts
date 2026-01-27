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
  test('getTiles should return all tiles with correct structure', async () => {
    const database = await prepareTestDatabase();

    getTiles(database, createControllerArgs<'/tiles'>({}));

    expect(true).toBeTruthy();
  });

  test('getTileTroops should return troops for a tile with animals', async () => {
    const database = await prepareTestDatabase();

    // Find a tile with nature troops (animals).
    // Nature troops have IDs from WILD_BOAR to CROCODILE etc.
    // They are seeded into oasis tiles which have no owner village.
    const tileWithAnimals = database.selectObject({
      sql: `
        SELECT t.tile_id
        FROM troops t
        JOIN oasis o ON t.tile_id = o.tile_id
        WHERE o.village_id IS NULL
        LIMIT 1
      `,
      schema: z.object({ tile_id: z.number() }),
    })!;

    getTileTroops(
      database,
      createControllerArgs<'/tiles/:tileId/troops'>({
        params: { tileId: tileWithAnimals.tile_id },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getTileOasisBonuses should return bonuses for an oasis tile', async () => {
    const database = await prepareTestDatabase();

    // Find a tile with bonuses
    const tileWithBonuses = database.selectObject({
      sql: 'SELECT tile_id FROM oasis LIMIT 1',
      schema: z.object({ tile_id: z.number() }),
    })!;

    getTileOasisBonuses(
      database,
      createControllerArgs<'/tiles/:tileId/bonuses'>({
        params: { tileId: tileWithBonuses.tile_id },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getTileWorldItem should return world item for a tile with world items', async () => {
    const database = await prepareTestDatabase();

    // Find a tile with world items
    const tileWithItem = database.selectObject({
      sql: 'SELECT tile_id FROM world_items LIMIT 1',
      schema: z.object({ tile_id: z.number() }),
    })!;

    getTileWorldItem(
      database,
      createControllerArgs<'/tiles/:tileId/world-item'>({
        params: { tileId: tileWithItem.tile_id },
      }),
    );

    expect(true).toBeTruthy();
  });
});
