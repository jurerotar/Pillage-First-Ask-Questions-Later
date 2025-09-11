import type { ApiHandler } from 'app/interfaces/api';
import type { Preferences } from 'app/interfaces/models/game/preferences';
import { snakeCase } from 'moderndash';
import { z } from 'zod';
import type { AvailableLocale } from 'app/interfaces/models/locale';

const getPreferencesSchema = z
  .strictObject({
    color_scheme: z.enum(['light', 'dark']),
    locale: z.enum(['en-US'] satisfies AvailableLocale[]),
    time_of_day: z.enum(['day', 'night'] satisfies Preferences['timeOfDay'][]),
    skin_variant: z.enum(['default'] satisfies Preferences['skinVariant'][]),
    is_accessibility_mode_enabled: z.number(),
    is_reduced_motion_mode_enabled: z.number(),
    should_show_building_names: z.number(),
    is_automatic_navigation_after_building_level_change_enabled: z.number(),
    is_developer_mode_enabled: z.number(),
    should_show_notifications_on_building_upgrade_completion: z.number(),
    should_show_notifications_on_unit_upgrade_completion: z.number(),
    should_show_notifications_on_academy_research_completion: z.number(),
  })
  .transform((t) => {
    return {
      colorScheme: t.color_scheme,
      locale: t.locale,
      timeOfDay: t.time_of_day,
      skinVariant: t.skin_variant,
      isAccessibilityModeEnabled: Boolean(t.is_accessibility_mode_enabled),
      isReducedMotionModeEnabled: Boolean(t.is_reduced_motion_mode_enabled),
      shouldShowBuildingNames: Boolean(t.should_show_building_names),
      isAutomaticNavigationAfterBuildingLevelChangeEnabled: Boolean(
        t.is_automatic_navigation_after_building_level_change_enabled,
      ),
      isDeveloperModeEnabled: Boolean(t.is_developer_mode_enabled),
      shouldShowNotificationsOnBuildingUpgradeCompletion: Boolean(
        t.should_show_notifications_on_building_upgrade_completion,
      ),
      shouldShowNotificationsOnUnitUpgradeCompletion: Boolean(
        t.should_show_notifications_on_unit_upgrade_completion,
      ),
      shouldShowNotificationsOnAcademyResearchCompletion: Boolean(
        t.should_show_notifications_on_academy_research_completion,
      ),
    };
  });

export const getPreferences: ApiHandler<
  z.infer<typeof getPreferencesSchema>
> = async (_queryClient, database) => {
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

  return getPreferencesSchema.parse(row);
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
