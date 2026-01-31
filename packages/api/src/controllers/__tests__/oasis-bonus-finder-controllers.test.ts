import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  type GetTilesWithBonusesBody,
  getTilesWithBonuses,
} from '../oasis-bonus-finder-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('oasis-bonus-finder-controllers', () => {
  test('getTilesWithBonuses should return tiles with bonuses', async () => {
    const database = await prepareTestDatabase();

    getTilesWithBonuses(
      database,
      createControllerArgs<
        '/oasis-bonus-finder',
        'get',
        GetTilesWithBonusesBody
      >({
        query: { x: 0, y: 0 },
        body: {
          resourceFieldComposition: 'any-cropper',
          bonuses: {
            firstOasis: [{ resource: 'wheat', bonus: 50 }],
            secondOasis: [],
            thirdOasis: [],
          },
        },
      }),
    );

    expect(true).toBeTruthy();
  });
});
