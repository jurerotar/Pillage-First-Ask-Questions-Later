export const selectPreferencesQuery = `
  SELECT
    is_accessibility_mode_enabled,
    is_reduced_motion_mode_enabled,
    should_show_building_names,
    building_construction_view_mode,
    is_automatic_navigation_after_building_level_change_enabled,
    is_automatic_navigation_after_unit_research_enabled,
    is_automatic_navigation_after_unit_upgrade_enabled,
    is_automatic_navigation_after_send_units_enabled,
    is_developer_tools_console_enabled,
    should_show_notifications_on_building_upgrade_completion,
    should_show_notifications_on_unit_upgrade_completion,
    should_show_notifications_on_academy_research_completion
  FROM
    preferences;
`;

export const createUpdatePreferenceQuery = (column: string) => `
  UPDATE preferences
  SET
    ${column} = $value;
`;
