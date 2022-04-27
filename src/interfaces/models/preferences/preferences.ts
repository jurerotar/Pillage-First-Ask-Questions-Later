import { AvailableColorSchemes } from 'interfaces/models/preferences/color-scheme';
import { AvailableLocales } from 'interfaces/models/preferences/locale';

export type Preferences = {
  locale: AvailableLocales;
  colorScheme: AvailableColorSchemes;
  isColorSchemeSetExplicitly: boolean;
  isAccessibilityModeEnabled: boolean;
  isReducedMotionModeEnabled: boolean;
};
