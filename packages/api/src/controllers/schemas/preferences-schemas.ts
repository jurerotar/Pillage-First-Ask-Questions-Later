import { z } from 'zod';

export const getPreferencesSchema = z
  .strictObject({
    is_accessibility_mode_enabled: z.number(),
    is_reduced_motion_mode_enabled: z.number(),
    should_show_building_names: z.number(),
    building_construction_view_mode: z.enum(['detailed', 'compact']),
    is_automatic_navigation_after_building_level_change_enabled: z.number(),
    is_automatic_navigation_after_unit_research_enabled: z.number(),
    is_automatic_navigation_after_unit_upgrade_enabled: z.number(),
    is_automatic_navigation_after_send_units_enabled: z.number(),
    is_developer_tools_console_enabled: z.number(),
    should_show_notifications_on_building_upgrade_completion: z.number(),
    should_show_notifications_on_unit_upgrade_completion: z.number(),
    should_show_notifications_on_academy_research_completion: z.number(),
  })
  .meta({ id: 'GetPreferencesDbRow' });
