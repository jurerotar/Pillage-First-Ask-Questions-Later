import { snakeCase } from 'moderndash';
import type { Controller } from '../types/controller';
import { getPreferencesSchema } from './schemas/preferences-schemas';

export const getPreferences: Controller<'/players/:playerId/preferences'> = (
  database,
) => {
  return database.selectObject({
    sql: `
      SELECT
        is_accessibility_mode_enabled,
        is_reduced_motion_mode_enabled,
        should_show_building_names,
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
};

export const updatePreference: Controller<
  '/players/:playerId/preferences/:preferenceName',
  'patch'
> = (database, { body, params }) => {
  const { preferenceName } = params;
  const { value } = body;

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
};
