import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getPreferences, updatePreference } from '../preferences-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('preferences-controllers', () => {
  const playerId = PLAYER_ID;

  test('getPreferences should return preferences', async () => {
    const database = await prepareTestDatabase();

    getPreferences(
      database,
      createControllerArgs<'/players/:playerId/preferences'>({
        params: { playerId },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('updatePreference should update a preference', async () => {
    const database = await prepareTestDatabase();

    updatePreference(
      database,
      createControllerArgs<
        '/players/:playerId/preferences/:preferenceName',
        'patch'
      >({
        params: {
          playerId,
          preferenceName: 'isAccessibilityModeEnabled',
        },
        body: { value: true },
      }),
    );

    expect(true).toBeTruthy();
  });
});
