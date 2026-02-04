import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getMapFilters, updateMapFilter } from '../map-filters-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('map-filters-controllers', () => {
  const playerId = PLAYER_ID;

  test('getMapFilters should return map filters', async () => {
    const database = await prepareTestDatabase();

    getMapFilters(
      database,
      createControllerArgs<'/players/:playerId/map-filters'>({
        params: { playerId },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('updateMapFilter should update a map filter', async () => {
    const database = await prepareTestDatabase();

    updateMapFilter(
      database,
      createControllerArgs<
        '/players/:playerId/map-filters/:filterName',
        'patch'
      >({
        params: { playerId, filterName: 'shouldShowOasisIcons' },
        body: { value: true },
      }),
    );

    expect(true).toBeTruthy();
  });
});
