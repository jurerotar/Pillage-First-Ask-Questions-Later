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
    is_instant_unit_travel_enabled: z.number(),
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
      isInstantUnitTravelEnabled: Boolean(t.is_instant_unit_travel_enabled),
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
  return database.selectObject({
    sql: `
      SELECT
        is_instant_building_construction_enabled,
        is_instant_unit_training_enabled,
        is_instant_unit_improvement_enabled,
        is_instant_unit_research_enabled,
        is_instant_unit_travel_enabled,
        is_free_building_construction_enabled,
        is_free_unit_training_enabled,
        is_free_unit_improvement_enabled,
        is_free_unit_research_enabled
      FROM
        developer_settings
    `,
    schema: getDeveloperSettingsSchema,
  });
};

export type UpdateDeveloperSettingsBody = {
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

  database.exec({
    sql: `
      UPDATE developer_settings
      SET
        ${column} = $value
    `,
    bind: {
      $value: value,
    },
  });

  if (value) {
    let eventTypes: string[] = [];

    switch (developerSettingName) {
      case 'isInstantBuildingConstructionEnabled':
        eventTypes = [
          'buildingLevelChange',
          'buildingScheduledConstruction',
          'buildingConstruction',
          'buildingDestruction',
        ];
        break;
      case 'isInstantUnitTrainingEnabled':
        eventTypes = ['troopTraining'];
        break;
      case 'isInstantUnitImprovementEnabled':
        eventTypes = ['unitImprovement'];
        break;
      case 'isInstantUnitResearchEnabled':
        eventTypes = ['unitResearch'];
        break;
      case 'isInstantUnitTravelEnabled':
        eventTypes = ['troopMovement'];
        break;
    }

    if (eventTypes.length > 0) {
      database.exec({
        sql: `
          UPDATE events
          SET
            starts_at = $now,
            duration = 0
          WHERE
            type IN (${eventTypes.map((t) => `'${t}'`).join(', ')})
        `,
        bind: {
          $now: Date.now(),
        },
      });

      triggerKick();
    }
  }
};

type SpawnHeroItemBody = {
  itemId: string;
};

/**
 * PATCH /developer-settings/:heroId/spawn-item
 * @pathParam {number} heroId
 * @bodyContent application/json SpawnHeroItemBody
 * @bodyRequired
 */
export const spawnHeroItem: Controller<
  '/developer-settings/:heroId/spawn-item',
  'patch',
  SpawnHeroItemBody
> = (database, { body, params }) => {
  const { heroId } = params;
  const { itemId } = body;

  database.exec({
    sql: `
      INSERT INTO hero_inventory (hero_id, item_id, amount)
      VALUES ($heroId, $itemId, 1)
      ON CONFLICT (hero_id, item_id) DO UPDATE SET
        amount = amount + 1
    `,
    bind: {
      $heroId: heroId,
      $itemId: itemId,
    },
  });
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

/**
 * PATCH /developer-settings/:heroId/increment-adventure-points
 * @pathParam {number} heroId
 */
export const incrementHeroAdventurePoints: Controller<
  '/developer-settings/:heroId/increment-adventure-points',
  'patch'
> = (database, { params }) => {
  const { heroId } = params;

  database.exec({
    sql: `
      UPDATE hero_adventures
      SET
        available = available + 1
      WHERE
        hero_id = $heroId
    `,
    bind: {
      $heroId: heroId,
    },
  });
};
