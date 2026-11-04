import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getPreferences, updatePreference } from '../preferences-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('preferences-controllers', () => {
  const playerId = PLAYER_ID;

  test('getPreferences should return preferences', async () => {
    using database = await prepareTestDatabase();

    const preferences = getPreferences(
      database,
      createControllerArgs<'/me/preferences'>({
        context: { playerId },
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
    using database = await prepareTestDatabase();

    updatePreference(
      database,
      createControllerArgs<'/me/preferences/:preferenceName', 'patch'>({
        context: { playerId },
        path: {
          preferenceName: 'villageSort',
        },
        body: { value: 'populationDesc' },
      }),
    );

    expect(
      getPreferences(
        database,
        createControllerArgs<'/me/preferences'>({
          context: { playerId },
        }),
      ).villageSort,
    ).toBe('populationDesc');
  });

  test('updatePreference should update a preference', async () => {
    using database = await prepareTestDatabase();

    updatePreference(
      database,
      createControllerArgs<'/me/preferences/:preferenceName', 'patch'>({
        context: { playerId },
        path: {
          preferenceName: 'isAccessibilityModeEnabled',
        },
        body: { value: true },
      }),
    );

    expect(
      getPreferences(
        database,
        createControllerArgs<'/me/preferences'>({
          context: { playerId },
        }),
      ).isAccessibilityModeEnabled,
    ).toBe(true);
  });
});
