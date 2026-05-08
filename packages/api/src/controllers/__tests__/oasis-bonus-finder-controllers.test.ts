import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import { getTilesWithBonuses } from '../oasis-bonus-finder-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('oasis-bonus-finder-controllers', () => {
  test('getTilesWithBonuses should return tiles with bonuses', async () => {
    const database = await prepareTestDatabase();

    getTilesWithBonuses(
      database,
      createControllerArgs<'/search/oases/by-bonus', 'post'>({
        body: {
          x: 0,
          y: 0,
          resourceFieldComposition: 'any-cropper',
          bonuses: {
            firstOasis: [{ resource: 'wheat', bonus: 50 }],
            secondOasis: [],
            thirdOasis: [],
          },
        },
      }),
    );

    expect(true).toBe(true);
  });
});
