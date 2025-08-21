import type { AvailableLocale } from 'app/interfaces/models/locale';

type TimeOfDay = 'day' | 'night';

type SkinVariant = 'default' | 'snow';

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
