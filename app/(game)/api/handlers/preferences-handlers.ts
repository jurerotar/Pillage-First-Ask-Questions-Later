import type { ApiHandler } from 'app/interfaces/api';
import type {
  Preferences,
  PreferencesModel,
} from 'app/interfaces/models/game/preferences';
import { preferencesApiResource } from 'app/(game)/api/api-resources/preferences-api-resources';
import { snakeCase } from 'moderndash';

export const getPreferences: ApiHandler<Preferences> = async (
  _queryClient,
  database,
) => {
  const row = database.selectObject(
    `
      SELECT
        color_scheme,
        locale,
        time_of_day,
        skin_variant,
        is_accessibility_mode_enabled,
        is_reduced_motion_mode_enabled,
        should_show_building_names,
        is_automatic_navigation_after_building_level_change_enabled,
        is_developer_mode_enabled,
        should_show_notifications_on_building_upgrade_completion,
        should_show_notifications_on_unit_upgrade_completion,
        should_show_notifications_on_academy_research_completion
      FROM preferences
    `,
  ) as unknown as PreferencesModel;

  return preferencesApiResource(row);
};

type UpdatePreferenceBody = {
  value: Preferences[keyof Preferences];
};

export const updatePreference: ApiHandler<
  void,
  'preferenceName',
  UpdatePreferenceBody
> = async (_queryClient, database, { body, params }) => {
  const { preferenceName } = params;
  const { value } = body;

  const column = snakeCase(preferenceName);

  database.exec({
    sql: `
      UPDATE preferences
      SET ${column} = $value
    `,
    bind: {
      $value: value,
    },
  });
};
