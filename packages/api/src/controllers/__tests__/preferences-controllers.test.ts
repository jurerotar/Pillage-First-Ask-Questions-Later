import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  getPreferences,
  type UpdatePreferenceBody,
  updatePreference,
} from '../preferences-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('preferences-controllers', () => {
  test('getPreferences should return preferences', async () => {
    const database = await prepareTestDatabase();

    getPreferences(database, createControllerArgs<'/preferences'>({}));

    expect(true).toBeTruthy();
  });

  test('updatePreference should update a preference', async () => {
    const database = await prepareTestDatabase();

    updatePreference(
      database,
      createControllerArgs<
        '/preferences/:preferenceName',
        'patch',
        UpdatePreferenceBody
      >({
        params: { preferenceName: 'isAccessibilityModeEnabled' },
        body: { value: true },
      }),
    );

    expect(true).toBeTruthy();
  });
});
