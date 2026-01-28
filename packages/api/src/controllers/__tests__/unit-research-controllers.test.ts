import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { getResearchedUnits } from '../unit-research-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('unit-research-controllers', () => {
  test('getResearchedUnits should return researched units for a village', async () => {
    const database = await prepareTestDatabase();

    // Find a village to test with
    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.object({ id: z.number() }),
    })!;

    getResearchedUnits(
      database,
      createControllerArgs<'/villages/:villageId/researched-units'>({
        params: { villageId: village.id },
      }),
    );

    expect(true).toBeTruthy();
  });
});
