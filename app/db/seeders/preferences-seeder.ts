import type { Preferences } from 'app/interfaces/models/game/preferences';
import type { Database } from 'app/interfaces/models/common';

const sql = `INSERT INTO preferences (
   color_scheme,
   locale,
   time_of_day,
   skin_variant,
   is_accessibility_mode_enabled,
   is_reduced_motion_mode_enabled,
   should_show_building_names,
   is_automatic_navigation_after_building_level_change_enabled,
   is_developer_mode_enabled,
   should_show_notifications_on_building_upgrade_completion,
   should_show_notifications_on_unit_upgrade_completion,
   should_show_notifications_on_academy_research_completion)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

export const preferencesSeeder = (database: Database): void => {
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

  const values = [
    preferences.colorScheme,
    preferences.locale,
    preferences.timeOfDay,
    preferences.skinVariant,
    preferences.isAccessibilityModeEnabled,
    preferences.isReducedMotionModeEnabled,
    preferences.shouldShowBuildingNames,
    preferences.isAutomaticNavigationAfterBuildingLevelChangeEnabled,
    preferences.isDeveloperModeEnabled,
    preferences.shouldShowNotificationsOnBuildingUpgradeCompletion,
    preferences.shouldShowNotificationsOnUnitUpgradeCompletion,
    preferences.shouldShowNotificationsOnAcademyResearchCompletion,
  ];

  database.exec({
    sql,
    bind: values,
  });
};
