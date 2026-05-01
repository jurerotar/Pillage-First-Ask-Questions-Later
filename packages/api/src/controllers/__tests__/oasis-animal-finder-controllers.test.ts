import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { getOasesWithAnimals } from '../oasis-animal-finder-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('oasis-animal-finder-controllers', () => {
  test('getOasesWithAnimals should return oases with requested animals', async () => {
    const database = await prepareTestDatabase();

    const lowThreshold = getOasesWithAnimals(
      database,
      createControllerArgs<'/oasis-animal-finder'>({
        query: {
          x: 0,
          y: 0,
        },
        body: {
          animalFilters: [{ animal: 'RAT', amount: 1 }],
        },
      }),
    );

    const highThreshold = getOasesWithAnimals(
      database,
      createControllerArgs<'/oasis-animal-finder'>({
        query: {
          x: 0,
          y: 0,
        },
        body: {
          animalFilters: [{ animal: 'RAT', amount: 9999 }],
        },
      }),
    );

    expect(lowThreshold.length).toBeGreaterThan(0);
    expect(highThreshold.length).toBeLessThanOrEqual(lowThreshold.length);

    const first = lowThreshold[0]!;

    expect(first.bonuses.length).toBeGreaterThan(0);
    expect(first.animals.length).toBeGreaterThan(0);
    expect(first.animals.some(({ unitId }) => unitId === 'RAT')).toBe(true);

    const ratAmount = database.selectValue({
      sql: `
        SELECT COALESCE(SUM(t.amount), 0)
        FROM troops t
        JOIN unit_ids ui ON ui.id = t.unit_id
        WHERE t.tile_id = $tile_id
          AND ui.unit = 'RAT';
      `,
      bind: {
        $tile_id: first.tileId,
      },
      schema: z.number(),
    }) as number;

    expect(ratAmount).toBeGreaterThanOrEqual(1);
  });
});
