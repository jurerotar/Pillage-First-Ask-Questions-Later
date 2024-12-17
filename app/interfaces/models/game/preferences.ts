import type { AvailableLocales } from 'app/interfaces/models/locale';

type TimeOfDay = 'day' | 'night';

type SkinVariant = 'default' | 'snow';

export type Preferences = {
  locale: AvailableLocales;
  timeOfDay: TimeOfDay;
  skinVariant: SkinVariant;
  isAccessibilityModeEnabled: boolean;
  isReducedMotionModeEnabled: boolean;
};
