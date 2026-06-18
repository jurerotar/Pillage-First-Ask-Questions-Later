import type { z } from 'zod';
import { preferencesSchema } from '@pillage-first/types/models/preferences';
import type { getPreferencesSchema } from '../schemas/preferences-schemas';

export const mapPreferences = (row: z.infer<typeof getPreferencesSchema>) => {
  const dto = {
    isAccessibilityModeEnabled: Boolean(row.is_accessibility_mode_enabled),
    isReducedMotionModeEnabled: Boolean(row.is_reduced_motion_mode_enabled),
    shouldShowBuildingNames: Boolean(row.should_show_building_names),
    buildingConstructionViewMode: row.building_construction_view_mode,
    isAutomaticNavigationAfterBuildingLevelChangeEnabled: Boolean(
      row.is_automatic_navigation_after_building_level_change_enabled,
    ),
    isAutomaticNavigationAfterUnitResearchEnabled: Boolean(
      row.is_automatic_navigation_after_unit_research_enabled,
    ),
    isAutomaticNavigationAfterUnitUpgradeEnabled: Boolean(
      row.is_automatic_navigation_after_unit_upgrade_enabled,
    ),
    isAutomaticNavigationAfterSendUnitsEnabled: Boolean(
      row.is_automatic_navigation_after_send_units_enabled,
    ),
    isDeveloperToolsConsoleEnabled: Boolean(
      row.is_developer_tools_console_enabled,
    ),
    shouldShowNotificationsOnBuildingUpgradeCompletion: Boolean(
      row.should_show_notifications_on_building_upgrade_completion,
    ),
    shouldShowNotificationsOnUnitUpgradeCompletion: Boolean(
      row.should_show_notifications_on_unit_upgrade_completion,
    ),
    shouldShowNotificationsOnAcademyResearchCompletion: Boolean(
      row.should_show_notifications_on_academy_research_completion,
    ),
  };

  return preferencesSchema.parse(dto);
};
