import type { Preferences } from 'app/interfaces/models/game/preferences';

export const preferencesFactory = (): Preferences => {
  return {
    isAccessibilityModeEnabled: false,
    isReducedMotionModeEnabled: false,
    shouldShowBuildingNames: true,
    isAutomaticNavigationAfterBuildingLevelChangeEnabled: true,
    isDeveloperModeEnabled: false,
    shouldShowNotificationsOnBuildingUpgradeCompletion: false,
    shouldShowNotificationsOnUnitUpgradeCompletion: false,
    shouldShowNotificationsOnAcademyResearchCompletion: false,
  };
};
