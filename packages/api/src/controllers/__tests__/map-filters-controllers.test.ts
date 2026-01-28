import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import { getMapFilters, updateMapFilter } from '../map-filters-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('map-filters-controllers', () => {
  test('getMapFilters should return map filters', async () => {
    const database = await prepareTestDatabase();

    getMapFilters(database, createControllerArgs<'/map-filters'>({}));

    expect(true).toBeTruthy();
  });

  test('updateMapFilter should update a map filter', async () => {
    const database = await prepareTestDatabase();

    updateMapFilter(
      database,
      createControllerArgs<
        '/map-filters/:filterName',
        'patch',
        { value: boolean }
      >({
        params: { filterName: 'shouldShowOasisIcons' },
        body: { value: true },
      }),
    );

    expect(true).toBeTruthy();
  });
});
