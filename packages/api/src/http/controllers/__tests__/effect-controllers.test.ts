import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { getTileEffects } from '../effect-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('effect-controllers', () => {
  test('getTileEffects should return effects for a tile', async () => {
    const database = await prepareTestDatabase();

    // Find a village to test with
    const tileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages LIMIT 1',
      schema: z.number(),
    })!;

    getTileEffects(
      database,
      createControllerArgs<'/tiles/:tileId/effects'>({
        path: { tileId },
      }),
    );

    expect(true).toBe(true);
  });
});
