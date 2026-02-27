CREATE TABLE preferences
(
  player_id INTEGER PRIMARY KEY,

  -- Accessibility
  is_accessibility_mode_enabled INTEGER NOT NULL CHECK (is_accessibility_mode_enabled IN (0, 1)),
  is_reduced_motion_mode_enabled INTEGER NOT NULL CHECK (is_reduced_motion_mode_enabled IN (0, 1)),

  -- Display
  should_show_building_names INTEGER NOT NULL CHECK (should_show_building_names IN (0, 1)),
  building_construction_view_mode TEXT NOT NULL CHECK (building_construction_view_mode IN ('detailed', 'compact')),

  -- Functionality
  is_automatic_navigation_after_building_level_change_enabled INTEGER NOT NULL CHECK (is_automatic_navigation_after_building_level_change_enabled IN (0,1)),
  is_developer_tools_console_enabled INTEGER NOT NULL CHECK (is_developer_tools_console_enabled IN (0,1)),

  -- Notifications
  should_show_notifications_on_building_upgrade_completion INTEGER NOT NULL CHECK (should_show_notifications_on_building_upgrade_completion IN (0,1)),
  should_show_notifications_on_unit_upgrade_completion INTEGER NOT NULL CHECK (should_show_notifications_on_unit_upgrade_completion IN (0,1)),
  should_show_notifications_on_academy_research_completion INTEGER NOT NULL CHECK (should_show_notifications_on_academy_research_completion IN (0,1)),

  FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) STRICT, WITHOUT ROWID;
