import type { ApiHandler } from 'app/interfaces/api';
import type {
  Preferences,
} from 'app/interfaces/models/game/preferences';
import { snakeCase } from 'moderndash';
import { z } from 'zod';

const getPreferencesResponseSchema = z
  .strictObject({
    color_scheme: z.string(),
    locale: z.string(),
    time_of_day: z.string(),
    skin_variant: z.string(),
    is_accessibility_mode_enabled: z.boolean(),
    is_reduced_motion_mode_enabled: z.boolean(),
    should_show_building_names: z.boolean(),
    is_automatic_navigation_after_building_level_change_enabled: z.boolean(),
    is_developer_mode_enabled: z.boolean(),
    should_show_notifications_on_building_upgrade_completion: z.boolean(),
    should_show_notifications_on_unit_upgrade_completion: z.boolean(),
    should_show_notifications_on_academy_research_completion: z.boolean(),
  })
  .transform((t) => {
    return {
      colorScheme: t.color_scheme,
      locale: t.locale,
      timeOfDay: t.time_of_day,
      skinVariant: t.skin_variant,
      isAccessibilityModeEnabled: t.is_accessibility_mode_enabled,
      isReducedMotionModeEnabled: t.is_reduced_motion_mode_enabled,
      shouldShowBuildingNames: t.should_show_building_names,
      isAutomaticNavigationAfterBuildingLevelChangeEnabled:
      t.is_automatic_navigation_after_building_level_change_enabled,
      isDeveloperModeEnabled: t.is_developer_mode_enabled,
      shouldShowNotificationsOnBuildingUpgradeCompletion:
      t.should_show_notifications_on_building_upgrade_completion,
      shouldShowNotificationsOnUnitUpgradeCompletion:
      t.should_show_notifications_on_unit_upgrade_completion,
      shouldShowNotificationsOnAcademyResearchCompletion:
      t.should_show_notifications_on_academy_research_completion,
    };
  });

export const getPreferences: ApiHandler<z.infer<typeof getPreferencesResponseSchema>> = async (
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
  );

  return getPreferencesResponseSchema.parse(row);
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
