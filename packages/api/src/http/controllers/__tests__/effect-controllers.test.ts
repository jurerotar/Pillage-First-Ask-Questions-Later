import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { getTileEffects } from '../effect-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('effect-controllers', () => {
  test('getTileEffects should return effects for a tile', async () => {
    using database = await prepareTestDatabase();

    // Find a village to test with
    const tileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages LIMIT 1',
      schema: tileIdSchema,
    })!;

    const effects = getTileEffects(
      database,
      createControllerArgs<'/tiles/:tileId/effects'>({
        path: { tileId },
      }),
    );

    expect(effects).toContainEqual(
      expect.objectContaining({
        id: 'woodProduction',
        scope: 'local',
        source: 'building',
        tileId,
      }),
    );
    expect(
      effects.every((effect) =>
        effect.scope === 'local' ? effect.tileId === tileId : true,
      ),
    ).toBe(true);
  });
});
