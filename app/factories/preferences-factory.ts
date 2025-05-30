import type { Preferences } from 'app/interfaces/models/game/preferences';

export const preferencesFactory = (): Preferences => {
  return {
    colorScheme: 'light',
    locale: 'en-US',
    timeOfDay: 'day',
    skinVariant: 'default',
    isAccessibilityModeEnabled: false,
    isReducedMotionModeEnabled: false,
    shouldShowBuildingNames: true,
    isDeveloperModeEnabled: false,
  };
};
