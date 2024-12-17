import type { Preferences } from 'app/interfaces/models/game/preferences';

export const preferencesFactory = (): Preferences => {
  return {
    locale: 'en-US',
    timeOfDay: 'day',
    skinVariant: 'default',
    isAccessibilityModeEnabled: false,
    isReducedMotionModeEnabled: false,
  };
};
