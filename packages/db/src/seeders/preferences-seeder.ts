import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { env } from '@pillage-first/utils/env';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const preferencesSeeder = (database: DbFacade): void => {
  const isRunningLocally = env.DEV;

  const trueInDev = Number(isRunningLocally);
  const falseInDev = Number(!isRunningLocally);

  database.exec({
    sql: `
      INSERT INTO
        preferences (player_id, is_accessibility_mode_enabled, is_reduced_motion_mode_enabled,
                     should_show_building_names, building_construction_view_mode,
                     is_automatic_navigation_after_building_level_change_enabled,
                     is_automatic_navigation_after_unit_research_enabled,
                     is_automatic_navigation_after_unit_upgrade_enabled,
                     is_automatic_navigation_after_send_units_enabled, is_developer_tools_console_enabled,
                     should_show_time_skip_button,
                     should_show_notifications_on_building_upgrade_completion,
                     should_show_notifications_on_unit_upgrade_completion,
                     should_show_notifications_on_academy_research_completion)
      VALUES
        ($player_id, 0, 0, 1, 'detailed', ${falseInDev}, ${falseInDev}, ${falseInDev}, ${falseInDev}, ${trueInDev}, 1, 0, 0, 0)
    `,
    bind: {
      $player_id: PLAYER_ID,
    },
  });
};
