CREATE TABLE preferences (
  color_scheme TEXT CHECK (color_scheme IN ('light', 'dark')) NOT NULL,
  locale TEXT CHECK (locale IN ('en-US')) NOT NULL,
  time_of_day TEXT CHECK (time_of_day IN ('day', 'night')) NOT NULL,
  skin_variant TEXT CHECK (skin_variant IN ('default')) NOT NULL,
  is_accessibility_mode_enabled BOOLEAN NOT NULL,
  is_reduced_motion_mode_enabled BOOLEAN NOT NULL,
  should_show_building_names BOOLEAN NOT NULL,
  is_automatic_navigation_after_building_level_change_enabled BOOLEAN NOT NULL,
  is_developer_mode_enabled BOOLEAN NOT NULL,
  should_show_notifications_on_building_upgrade_completion BOOLEAN NOT NULL,
  should_show_notifications_on_unit_upgrade_completion BOOLEAN NOT NULL,
  should_show_notifications_on_academy_research_completion BOOLEAN NOT NULL
);
