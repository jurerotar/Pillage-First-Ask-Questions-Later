import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { Preferences } from '@pillage-first/types/models/preferences';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const preferencesSeeder = (database: DbFacade): void => {
  const preferences: Preferences = {
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
                               is_accessibility_mode_enabled,
                               is_reduced_motion_mode_enabled,
                               should_show_building_names,
                               is_automatic_navigation_after_building_level_change_enabled,
                               is_developer_mode_enabled,
                               should_show_notifications_on_building_upgrade_completion,
                               should_show_notifications_on_unit_upgrade_completion,
                               should_show_notifications_on_academy_research_completion)
      VALUES ($player_id,
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
