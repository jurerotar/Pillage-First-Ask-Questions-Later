import { snakeCase } from 'moderndash';
import { z } from 'zod';
import type { Preferences } from '@pillage-first/types/models/preferences';
import type { Controller } from '../types/controller';

const getPreferencesSchema = z
  .strictObject({
    is_accessibility_mode_enabled: z.number(),
    is_reduced_motion_mode_enabled: z.number(),
    should_show_building_names: z.number(),
    is_automatic_navigation_after_building_level_change_enabled: z.number(),
    is_developer_tools_console_enabled: z.number(),
    should_show_notifications_on_building_upgrade_completion: z.number(),
    should_show_notifications_on_unit_upgrade_completion: z.number(),
    should_show_notifications_on_academy_research_completion: z.number(),
  })
  .transform((t) => {
    return {
      isAccessibilityModeEnabled: Boolean(t.is_accessibility_mode_enabled),
      isReducedMotionModeEnabled: Boolean(t.is_reduced_motion_mode_enabled),
      shouldShowBuildingNames: Boolean(t.should_show_building_names),
      isAutomaticNavigationAfterBuildingLevelChangeEnabled: Boolean(
        t.is_automatic_navigation_after_building_level_change_enabled,
      ),
      isDeveloperToolsConsoleEnabled: Boolean(
        t.is_developer_tools_console_enabled,
      ),
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

/**
 * GET /players/:playerId/preferences
 */
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

export type UpdatePreferenceBody = {
  value: Preferences[keyof Preferences];
};

/**
 * PATCH /players/:playerId/preferences/:preferenceName
 * @pathParam {string} preferenceName
 * @bodyContent application/json UpdatePreferenceBody
 * @bodyRequired
 */
export const updatePreference: Controller<
  '/players/:playerId/preferences/:preferenceName',
  'patch',
  UpdatePreferenceBody
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
