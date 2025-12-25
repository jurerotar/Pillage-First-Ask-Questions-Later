export type TimeOfDay = 'day' | 'night';

export type SkinVariant = 'default' | 'snow';

export type UIColorScheme = 'light' | 'dark';

export type Preferences = {
  isAccessibilityModeEnabled: boolean;
  isReducedMotionModeEnabled: boolean;
  shouldShowBuildingNames: boolean;
  isAutomaticNavigationAfterBuildingLevelChangeEnabled: boolean;
  isDeveloperModeEnabled: boolean;
  shouldShowNotificationsOnBuildingUpgradeCompletion: boolean;
  shouldShowNotificationsOnUnitUpgradeCompletion: boolean;
  shouldShowNotificationsOnAcademyResearchCompletion: boolean;
};
