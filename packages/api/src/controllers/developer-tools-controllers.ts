import { snakeCase } from 'moderndash';
import { z } from 'zod';
import type { DeveloperSettings } from '@pillage-first/types/models/developer-settings';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { triggerKick } from '../scheduler/scheduler-signal';
import type { Controller } from '../types/controller';
import {
  addVillageResourcesAt,
  subtractVillageResourcesAt,
} from '../utils/village';

const getDeveloperSettingsSchema = z
  .strictObject({
    is_instant_building_construction_enabled: z.number(),
    is_instant_unit_training_enabled: z.number(),
    is_instant_unit_improvement_enabled: z.number(),
    is_instant_unit_research_enabled: z.number(),
    is_free_building_construction_enabled: z.number(),
    is_free_unit_training_enabled: z.number(),
    is_free_unit_improvement_enabled: z.number(),
    is_free_unit_research_enabled: z.number(),
  })
  .transform((t) => {
    return {
      isInstantBuildingConstructionEnabled: Boolean(
        t.is_instant_building_construction_enabled,
      ),
      isInstantUnitTrainingEnabled: Boolean(t.is_instant_unit_training_enabled),
      isInstantUnitImprovementEnabled: Boolean(
        t.is_instant_unit_improvement_enabled,
      ),
      isInstantUnitResearchEnabled: Boolean(t.is_instant_unit_research_enabled),
      isFreeBuildingConstructionEnabled: Boolean(
        t.is_free_building_construction_enabled,
      ),
      isFreeUnitTrainingEnabled: Boolean(t.is_free_unit_training_enabled),
      isFreeUnitImprovementEnabled: Boolean(t.is_free_unit_improvement_enabled),
      isFreeUnitResearchEnabled: Boolean(t.is_free_unit_research_enabled),
    };
  });

/**
 * GET /developer-settings
 */
export const getDeveloperSettings: Controller<'/developer-settings'> = (
  database,
) => {
  const row = database.selectObject(
    `
      SELECT
        is_instant_building_construction_enabled,
        is_instant_unit_training_enabled,
        is_instant_unit_improvement_enabled,
        is_instant_unit_research_enabled,
        is_free_building_construction_enabled,
        is_free_unit_training_enabled,
        is_free_unit_improvement_enabled,
        is_free_unit_research_enabled
      FROM
        developer_settings
    `,
  );

  return getDeveloperSettingsSchema.parse(row);
};

type UpdateDeveloperSettingsBody = {
  value: DeveloperSettings[keyof DeveloperSettings];
};

/**
 * PATCH /developer-settings/:developerSettingName
 * @pathParam {string} developerSettingName
 * @bodyContent application/json UpdateDeveloperSettingsBody
 * @bodyRequired
 */
export const updateDeveloperSettings: Controller<
  '/developer-settings/:developerSettingName',
  'patch',
  UpdateDeveloperSettingsBody
> = (database, { body, params }) => {
  const { developerSettingName } = params;
  const { value } = body;

  const column = snakeCase(developerSettingName);

  database.exec(
    `
      UPDATE developer_settings
      SET
        ${column} = $value
    `,
    {
      $value: value,
    },
  );

  if (developerSettingName === 'isDeveloperModeEnabled' && value) {
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

    triggerKick();
  }
};

const updateVillageResourcesSchema = z.strictObject({
  resource: resourceSchema,
  amount: z.union([z.literal(100), z.literal(1000), z.literal(10_000)]),
  direction: z.enum(['add', 'subtract']),
});

type UpdateVillageResourcesBody = z.infer<typeof updateVillageResourcesSchema>;

/**
 * PATCH /developer-settings/:villageId/resources
 * @pathParam {number} villageId
 * @bodyContent application/json UpdateVillageResourcesBody
 * @bodyRequired
 */
export const updateVillageResources: Controller<
  '/developer-settings/:villageId/resources',
  'patch',
  UpdateVillageResourcesBody
> = (database, { body, params }) => {
  const { villageId } = params;
  const { resource, amount, direction } = body;

  const now = Date.now();

  const resources = [0, 0, 0, 0];
  const resourceIndexMap = {
    wood: 0,
    clay: 1,
    iron: 2,
    wheat: 3,
  };

  resources[resourceIndexMap[resource]] = amount;

  const updaterFn =
    direction === 'add' ? addVillageResourcesAt : subtractVillageResourcesAt;

  updaterFn(database, villageId, now, resources);
};
