CREATE TABLE preferences
(
  id INTEGER PRIMARY KEY,

  -- Appearance
  color_scheme TEXT CHECK (color_scheme IN ('light', 'dark')),
  time_of_day TEXT CHECK (time_of_day IN ('day', 'night')),
  skin_variant TEXT CHECK (skin_variant IN ('default')),

  -- Localization
  locale TEXT CHECK (locale IN ('en-US')),

  -- Accessibility
  is_accessibility_mode_enabled BOOLEAN CHECK (is_accessibility_mode_enabled IN (0, 1)),
  is_reduced_motion_mode_enabled BOOLEAN CHECK (is_reduced_motion_mode_enabled IN (0, 1)),

  -- Display
  should_show_building_names BOOLEAN CHECK (should_show_building_names IN (0, 1)),

  -- Functionality
  is_automatic_navigation_after_building_level_change_enabled BOOLEAN CHECK (is_automatic_navigation_after_building_level_change_enabled IN (0,1)),
  is_developer_mode_enabled BOOLEAN CHECK (is_developer_mode_enabled IN (0,1)),

  -- Notifications
  should_show_notifications_on_building_upgrade_completion BOOLEAN CHECK (should_show_notifications_on_building_upgrade_completion IN (0,1)),
  should_show_notifications_on_unit_upgrade_completion BOOLEAN CHECK (should_show_notifications_on_unit_upgrade_completion IN (0,1)),
  should_show_notifications_on_academy_research_completion BOOLEAN CHECK (should_show_notifications_on_academy_research_completion IN (0,1))
);
