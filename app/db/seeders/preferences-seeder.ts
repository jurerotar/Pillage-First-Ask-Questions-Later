import type { Preferences } from 'app/interfaces/models/game/preferences';
import type { Seeder } from 'app/interfaces/db';
import { PLAYER_ID } from 'app/constants/player';

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

  database.exec({
    sql: `
      INSERT INTO preferences (
                               player_id,
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
      VALUES ($player_id,
              $color_scheme,
              $locale,
              $time_of_day,
              $skin_variant,
              $is_accessibility_mode_enabled,
              $is_reduced_motion_mode_enabled,
              $should_show_building_names,
              $is_automatic_navigation_after_building_level_change_enabled,
              $is_developer_mode_enabled,
              $should_show_notifications_on_building_upgrade_completion,
              $should_show_notifications_on_unit_upgrade_completion,
              $should_show_notifications_on_academy_research_completion)
    `,
    bind: {
      $player_id: PLAYER_ID,
      $color_scheme: preferences.colorScheme,
      $locale: preferences.locale,
      $time_of_day: preferences.timeOfDay,
      $skin_variant: preferences.skinVariant,
      $is_accessibility_mode_enabled: Number(
        preferences.isAccessibilityModeEnabled,
      ),
      $is_reduced_motion_mode_enabled: Number(
        preferences.isReducedMotionModeEnabled,
      ),
      $should_show_building_names: Number(preferences.shouldShowBuildingNames),
      $is_automatic_navigation_after_building_level_change_enabled: Number(
        preferences.isAutomaticNavigationAfterBuildingLevelChangeEnabled,
      ),
      $is_developer_mode_enabled: Number(preferences.isDeveloperModeEnabled),
      $should_show_notifications_on_building_upgrade_completion: Number(
        preferences.shouldShowNotificationsOnBuildingUpgradeCompletion,
      ),
      $should_show_notifications_on_unit_upgrade_completion: Number(
        preferences.shouldShowNotificationsOnUnitUpgradeCompletion,
      ),
      $should_show_notifications_on_academy_research_completion: Number(
        preferences.shouldShowNotificationsOnAcademyResearchCompletion,
      ),
    },
  });
};
