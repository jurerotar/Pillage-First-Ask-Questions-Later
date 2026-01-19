import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { Seeder } from '../types/seeder';

export const preferencesSeeder: Seeder = (database): void => {
  database.exec({
    sql: `
      INSERT INTO
        preferences (player_id, is_accessibility_mode_enabled, is_reduced_motion_mode_enabled,
                     should_show_building_names, is_automatic_navigation_after_building_level_change_enabled,
                     is_developer_tools_console_enabled, should_show_notifications_on_building_upgrade_completion,
                     should_show_notifications_on_unit_upgrade_completion,
                     should_show_notifications_on_academy_research_completion)
      VALUES
        ($player_id, 0, 0, 1, 1, 0, 0, 0, 0)
    `,
    bind: {
      $player_id: PLAYER_ID,
    },
  });
};
