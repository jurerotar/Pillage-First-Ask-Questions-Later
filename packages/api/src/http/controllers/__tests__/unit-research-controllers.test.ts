import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { getResearchedUnits } from '../unit-research-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('unit-research-controllers', () => {
  test('getResearchedUnits should return researched units for a village', async () => {
    const database = await prepareTestDatabase();

    // Find a village to test with
    const villageId = database.selectValue({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.number(),
    })!;

    database.exec({
      sql: `
        INSERT OR IGNORE INTO unit_research (village_id, unit_id)
        VALUES ($village_id, (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'));
      `,
      bind: { $village_id: villageId },
    });

    const researchedUnits = getResearchedUnits(
      database,
      createControllerArgs<'/villages/:villageId/researched-units'>({
        path: { villageId: villageId },
      }),
    );

    expect(researchedUnits).toContainEqual({ unitId: 'LEGIONNAIRE' });
  });
});
