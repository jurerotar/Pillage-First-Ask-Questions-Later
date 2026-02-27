import { z } from 'zod';

export const getPreferencesSchema = z
  .strictObject({
    is_accessibility_mode_enabled: z.number(),
    is_reduced_motion_mode_enabled: z.number(),
    should_show_building_names: z.number(),
    building_construction_view_mode: z.enum(['detailed', 'compact']),
    is_automatic_navigation_after_building_level_change_enabled: z.number(),
    is_developer_tools_console_enabled: z.number(),
    should_show_notifications_on_building_upgrade_completion: z.number(),
    should_show_notifications_on_unit_upgrade_completion: z.number(),
    should_show_notifications_on_academy_research_completion: z.number(),
  })
  .transform((t) => {
    return {
      isAccessibilityModeEnabled: Boolean(t.is_accessibility_mode_enabled),
      isReducedMotionModeEnabled: Boolean(t.is_reduced_motion_mode_enabled),
      shouldShowBuildingNames: Boolean(t.should_show_building_names),
      buildingConstructionViewMode: t.building_construction_view_mode,
      isAutomaticNavigationAfterBuildingLevelChangeEnabled: Boolean(
        t.is_automatic_navigation_after_building_level_change_enabled,
      ),
      isDeveloperToolsConsoleEnabled: Boolean(
        t.is_developer_tools_console_enabled,
      ),
      shouldShowNotificationsOnBuildingUpgradeCompletion: Boolean(
        t.should_show_notifications_on_building_upgrade_completion,
      ),
      shouldShowNotificationsOnUnitUpgradeCompletion: Boolean(
        t.should_show_notifications_on_unit_upgrade_completion,
      ),
      shouldShowNotificationsOnAcademyResearchCompletion: Boolean(
        t.should_show_notifications_on_academy_research_completion,
      ),
    };
  })
  .pipe(
    z.object({
      isAccessibilityModeEnabled: z.boolean(),
      isReducedMotionModeEnabled: z.boolean(),
      shouldShowBuildingNames: z.boolean(),
      buildingConstructionViewMode: z.enum(['detailed', 'compact']),
      isAutomaticNavigationAfterBuildingLevelChangeEnabled: z.boolean(),
      isDeveloperToolsConsoleEnabled: z.boolean(),
      shouldShowNotificationsOnBuildingUpgradeCompletion: z.boolean(),
      shouldShowNotificationsOnUnitUpgradeCompletion: z.boolean(),
      shouldShowNotificationsOnAcademyResearchCompletion: z.boolean(),
    }),
  )
  .meta({ id: 'GetPreferences' });
