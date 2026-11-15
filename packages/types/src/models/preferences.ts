import { z } from 'zod';

const uiColorSchemeSchema = z
  .enum(['light', 'dark'])
  .meta({ id: 'UIColorScheme' });
const timeOfDaySchema = z.enum(['day', 'night']).meta({ id: 'TimeOfDay' });
const skinVariantSchema = z.enum(['default']).meta({ id: 'SkinVariant' });
export const villageSortSchema = z
  .enum(['alphabetic', 'populationAsc', 'populationDesc'])
  .meta({ id: 'VillageSort' });

export type UIColorScheme = z.infer<typeof uiColorSchemeSchema>;
export type TimeOfDay = z.infer<typeof timeOfDaySchema>;
export type SkinVariant = z.infer<typeof skinVariantSchema>;
export type VillageSort = z.infer<typeof villageSortSchema>;

export const preferencesSchema = z
  .strictObject({
    isAccessibilityModeEnabled: z.boolean(),
    isReducedMotionModeEnabled: z.boolean(),
    shouldShowBuildingNames: z.boolean(),
    isAutomaticNavigationAfterBuildingLevelChangeEnabled: z.boolean(),
    isAutomaticNavigationAfterUnitResearchEnabled: z.boolean(),
    isAutomaticNavigationAfterUnitUpgradeEnabled: z.boolean(),
    isAutomaticNavigationAfterSendUnitsEnabled: z.boolean(),
    isDeveloperToolsConsoleEnabled: z.boolean(),
    villageSort: villageSortSchema,
    shouldShowNotificationsOnBuildingUpgradeCompletion: z.boolean(),
    shouldShowNotificationsOnUnitUpgradeCompletion: z.boolean(),
    shouldShowNotificationsOnAcademyResearchCompletion: z.boolean(),
  })
  .meta({ id: 'Preferences' });

export type Preferences = z.infer<typeof preferencesSchema>;
