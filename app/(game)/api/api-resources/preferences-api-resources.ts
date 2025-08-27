import type {
  Preferences,
  PreferencesModel,
} from 'app/interfaces/models/game/preferences';

export const preferencesApiResource = (
  preferencesModel: PreferencesModel,
): Preferences => {
  return {
    colorScheme: preferencesModel.color_scheme,
    locale: preferencesModel.locale,
    timeOfDay: preferencesModel.time_of_day,
    skinVariant: preferencesModel.skin_variant,
    isAccessibilityModeEnabled: preferencesModel.is_accessibility_mode_enabled,
    isReducedMotionModeEnabled: preferencesModel.is_reduced_motion_mode_enabled,
    shouldShowBuildingNames: preferencesModel.should_show_building_names,
    isAutomaticNavigationAfterBuildingLevelChangeEnabled:
      preferencesModel.is_automatic_navigation_after_building_level_change_enabled,
    isDeveloperModeEnabled: preferencesModel.is_developer_mode_enabled,
    shouldShowNotificationsOnBuildingUpgradeCompletion:
      preferencesModel.should_show_notifications_on_building_upgrade_completion,
    shouldShowNotificationsOnUnitUpgradeCompletion:
      preferencesModel.should_show_notifications_on_unit_upgrade_completion,
    shouldShowNotificationsOnAcademyResearchCompletion:
      preferencesModel.should_show_notifications_on_academy_research_completion,
  };
};
