import type { AvailableLocale } from 'app/interfaces/models/locale';

type TimeOfDay = 'day' | 'night';

type SkinVariant = 'default';

type ColorScheme = 'light' | 'dark';

export type PreferencesModel = {
  color_scheme: ColorScheme;
  locale: AvailableLocale;
  time_of_day: TimeOfDay;
  skin_variant: SkinVariant;
  is_accessibility_mode_enabled: boolean;
  is_reduced_motion_mode_enabled: boolean;
  should_show_building_names: boolean;
  is_automatic_navigation_after_building_level_change_enabled: boolean;
  is_developer_mode_enabled: boolean;
  should_show_notifications_on_building_upgrade_completion: boolean;
  should_show_notifications_on_unit_upgrade_completion: boolean;
  should_show_notifications_on_academy_research_completion: boolean;
};

export type Preferences = {
  colorScheme: 'light' | 'dark';
  locale: AvailableLocale;
  timeOfDay: TimeOfDay;
  skinVariant: SkinVariant;
  isAccessibilityModeEnabled: boolean;
  isReducedMotionModeEnabled: boolean;
  shouldShowBuildingNames: boolean;
  isAutomaticNavigationAfterBuildingLevelChangeEnabled: boolean;
  isDeveloperModeEnabled: boolean;
  shouldShowNotificationsOnBuildingUpgradeCompletion: boolean;
  shouldShowNotificationsOnUnitUpgradeCompletion: boolean;
  shouldShowNotificationsOnAcademyResearchCompletion: boolean;
};
