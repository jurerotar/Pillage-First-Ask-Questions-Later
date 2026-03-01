import { snakeCase } from 'moderndash';
import { createController } from '../utils/controller';
import { getPreferencesSchema } from './schemas/preferences-schemas';

export const getPreferences = createController(
  '/players/:playerId/preferences',
)(({ database }) => {
  return database.selectObject({
    sql: `
      SELECT
        is_accessibility_mode_enabled,
        is_reduced_motion_mode_enabled,
        should_show_building_names,
        building_construction_view_mode,
        is_automatic_navigation_after_building_level_change_enabled,
        is_developer_tools_console_enabled,
        should_show_notifications_on_building_upgrade_completion,
        should_show_notifications_on_unit_upgrade_completion,
        should_show_notifications_on_academy_research_completion
      FROM
        preferences
    `,
    schema: getPreferencesSchema,
  })!;
});

export const updatePreference = createController(
  '/players/:playerId/preferences/:preferenceName',
  'patch',
)(({ database, path: { preferenceName }, body: { value } }) => {
  const column = snakeCase(preferenceName);

  database.exec({
    sql: `
      UPDATE preferences
      SET
        ${column} = $value
    `,
    bind: {
      $value: value,
    },
  });
});
