import type { AvailableColorSchemes } from 'app/interfaces/models/preferences/color-scheme';
import type { AvailableLocales } from 'app/interfaces/models/preferences/locale';

export type Preferences = {
  locale: AvailableLocales;
  colorScheme: AvailableColorSchemes;
  isColorSchemeSetExplicitly: boolean;
  isAccessibilityModeEnabled: boolean;
  isReducedMotionModeEnabled: boolean;
};
