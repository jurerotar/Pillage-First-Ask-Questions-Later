import { z } from 'zod';

export const preferencesColorSchemeSchema = z.enum(['light', 'dark']);
export const preferencesTimeOfDaySchema = z.enum(['day', 'night']);
export const preferencesSkinVariantSchema = z.enum(['default']);
export const preferencesLocaleSchema = z.enum(['en-US']);

export const preferencesSchema = z.strictObject({
  isAccessibilityModeEnabled: z.boolean(),
  isReducedMotionModeEnabled: z.boolean(),
  shouldShowBuildingNames: z.boolean(),
  isAutomaticNavigationAfterBuildingLevelChangeEnabled: z.boolean(),
  isDeveloperModeEnabled: z.boolean(),
  shouldShowNotificationsOnBuildingUpgradeCompletion: z.boolean(),
  shouldShowNotificationsOnUnitUpgradeCompletion: z.boolean(),
  shouldShowNotificationsOnAcademyResearchCompletion: z.boolean(),
});

export type Preferences = z.infer<typeof preferencesSchema>;
