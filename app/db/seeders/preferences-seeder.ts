import type { Preferences } from 'app/interfaces/models/game/preferences';
import type { Seeder } from 'app/interfaces/db';

export const preferencesSeeder: Seeder = (database): void => {
  const preferences: Preferences = {
    colorScheme: 'light',
    locale: 'en-US',
    timeOfDay: 'day',
    skinVariant: 'default',
    isAccessibilityModeEnabled: false,
    isReducedMotionModeEnabled: false,
    shouldShowBuildingNames: true,
    isAutomaticNavigationAfterBuildingLevelChangeEnabled: true,
    isDeveloperModeEnabled: false,
    shouldShowNotificationsOnBuildingUpgradeCompletion: false,
    shouldShowNotificationsOnUnitUpgradeCompletion: false,
    shouldShowNotificationsOnAcademyResearchCompletion: false,
  };

  const entries: [string, string | null, boolean | null][] = [
    ['colorScheme', preferences.colorScheme, null],
    ['locale', preferences.locale, null],
    ['timeOfDay', preferences.timeOfDay, null],
    ['skinVariant', preferences.skinVariant, null],
    [
      'isAccessibilityModeEnabled',
      null,
      preferences.isAccessibilityModeEnabled,
    ],
    [
      'isReducedMotionModeEnabled',
      null,
      preferences.isReducedMotionModeEnabled,
    ],
    ['shouldShowBuildingNames', null, preferences.shouldShowBuildingNames],
    [
      'isAutomaticNavigationAfterBuildingLevelChangeEnabled',
      null,
      preferences.isAutomaticNavigationAfterBuildingLevelChangeEnabled,
    ],
    ['isDeveloperModeEnabled', null, preferences.isDeveloperModeEnabled],
    [
      'shouldShowNotificationsOnBuildingUpgradeCompletion',
      null,
      preferences.shouldShowNotificationsOnBuildingUpgradeCompletion,
    ],
    [
      'shouldShowNotificationsOnUnitUpgradeCompletion',
      null,
      preferences.shouldShowNotificationsOnUnitUpgradeCompletion,
    ],
    [
      'shouldShowNotificationsOnAcademyResearchCompletion',
      null,
      preferences.shouldShowNotificationsOnAcademyResearchCompletion,
    ],
  ];

  const stmt = database.prepare(`
    INSERT INTO preferences (preference_key, text_value, bool_value)
    VALUES ($preference_key, $text_value, $bool_value);
  `);

  for (const [id, text, bool] of entries) {
    stmt
      .bind({
        $preference_key: id,
        $text_value: text,
        $bool_value: bool,
      })
      .stepReset();
  }

  stmt.finalize();
};
