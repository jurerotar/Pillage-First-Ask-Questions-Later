import type { Preferences } from 'app/interfaces/models/game/preferences';

export const preferencesFactory = (): Preferences => {
  return {
    colorScheme: 'light',
    locale: 'en-us',
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
};
