import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getPreferences, updatePreference } from '../preferences-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('preferences-controllers', () => {
  const playerId = PLAYER_ID;

  test('getPreferences should return preferences', async () => {
    const database = await prepareTestDatabase();

    const preferences = getPreferences(
      database,
      createControllerArgs<'/players/:playerId/preferences'>({
        path: { playerId },
      }),
    );

    expect(preferences).toMatchObject({
      isAccessibilityModeEnabled: expect.any(Boolean),
      isDeveloperToolsConsoleEnabled: expect.any(Boolean),
      shouldShowBuildingNames: expect.any(Boolean),
      villageSort: 'alphabetic',
    });
  });

  test('updatePreference should update village sorting preference', async () => {
    const database = await prepareTestDatabase();

    updatePreference(
      database,
      createControllerArgs<
        '/players/:playerId/preferences/:preferenceName',
        'patch'
      >({
        path: {
          playerId,
          preferenceName: 'villageSort',
        },
        body: { value: 'populationDesc' },
      }),
    );

    expect(
      getPreferences(
        database,
        createControllerArgs<'/players/:playerId/preferences'>({
          path: { playerId },
        }),
      ).villageSort,
    ).toBe('populationDesc');
  });

  test('updatePreference should update a preference', async () => {
    const database = await prepareTestDatabase();

    updatePreference(
      database,
      createControllerArgs<
        '/players/:playerId/preferences/:preferenceName',
        'patch'
      >({
        path: {
          playerId,
          preferenceName: 'isAccessibilityModeEnabled',
        },
        body: { value: true },
      }),
    );

    expect(
      getPreferences(
        database,
        createControllerArgs<'/players/:playerId/preferences'>({
          path: { playerId },
        }),
      ).isAccessibilityModeEnabled,
    ).toBe(true);
  });
});
