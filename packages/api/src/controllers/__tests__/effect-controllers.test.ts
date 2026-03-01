import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { getVillageEffects } from '../effect-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('effect-controllers', () => {
  test('getVillageEffects should return effects for a village', async () => {
    const database = await prepareTestDatabase();

    // Find a village to test with
    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.strictObject({ id: z.number() }),
    })!;

    getVillageEffects(
      database,
      createControllerArgs<'/villages/:villageId/effects'>({
        path: { villageId: village.id },
      }),
    );

    expect(true).toBeTruthy();
  });
});
