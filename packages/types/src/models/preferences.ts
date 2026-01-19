import { z } from 'zod';

const uiColorSchemeSchema = z.enum(['light', 'dark']);
const timeOfDaySchema = z.enum(['day', 'night']);
const skinVariantSchema = z.enum(['default']);

export type UIColorScheme = z.infer<typeof uiColorSchemeSchema>;
export type TimeOfDay = z.infer<typeof timeOfDaySchema>;
export type SkinVariant = z.infer<typeof skinVariantSchema>;

export const preferencesSchema = z.strictObject({
  isAccessibilityModeEnabled: z.boolean(),
  isReducedMotionModeEnabled: z.boolean(),
  shouldShowBuildingNames: z.boolean(),
  isAutomaticNavigationAfterBuildingLevelChangeEnabled: z.boolean(),
  isDeveloperToolsConsoleEnabled: z.boolean(),
  shouldShowNotificationsOnBuildingUpgradeCompletion: z.boolean(),
  shouldShowNotificationsOnUnitUpgradeCompletion: z.boolean(),
  shouldShowNotificationsOnAcademyResearchCompletion: z.boolean(),
});

export type Preferences = z.infer<typeof preferencesSchema>;
