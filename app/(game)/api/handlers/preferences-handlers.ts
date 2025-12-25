import { snakeCase } from 'moderndash';
import { z } from 'zod';
import { kickSchedulerNow } from 'app/(game)/api/engine/scheduler';
import type { ApiHandler } from 'app/interfaces/api';
import type { Preferences } from 'app/interfaces/models/game/preferences';

const getPreferencesSchema = z
  .strictObject({
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

export const getPreferences: ApiHandler = (database) => {
  const row = database.selectObject(
    `
      SELECT
        is_accessibility_mode_enabled,
        is_reduced_motion_mode_enabled,
        should_show_building_names,
        is_automatic_navigation_after_building_level_change_enabled,
        is_developer_mode_enabled,
        should_show_notifications_on_building_upgrade_completion,
        should_show_notifications_on_unit_upgrade_completion,
        should_show_notifications_on_academy_research_completion
      FROM
        preferences
    `,
  );

  return getPreferencesSchema.parse(row);
};

type UpdatePreferenceBody = {
  value: Preferences[keyof Preferences];
};

export const updatePreference: ApiHandler<
  'preferenceName',
  UpdatePreferenceBody
> = (database, { body, params }) => {
  const { preferenceName } = params;
  const { value } = body;

  const column = snakeCase(preferenceName);

  database.exec(
    `
      UPDATE preferences
      SET
        ${column} = $value
    `,
    {
      $value: value,
    },
  );

  if (preferenceName === 'isDeveloperModeEnabled' && value === true) {
    database.exec(
      `
        UPDATE events
        SET
          starts_at = $now,
          duration = 0
        WHERE
          type IN ('buildingLevelChange', 'buildingScheduledConstruction', 'unitResearch', 'unitImprovement')
      `,
      {
        $now: Date.now(),
      },
    );

    kickSchedulerNow(database);
  }
};
