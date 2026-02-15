import { snakeCase } from 'moderndash';
import { triggerKick } from '../scheduler/scheduler-signal';
import { createController } from '../utils/controller';
import {
  addVillageResourcesAt,
  subtractVillageResourcesAt,
} from '../utils/village';
import { getDeveloperSettingsSchema } from './schemas/developer-tools-schemas';

export const getDeveloperSettings = createController('/developer-settings')(
  ({ database }) => {
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
  },
);

export const updateDeveloperSettings = createController(
  '/developer-settings/:developerSettingName',
  'patch',
)(({ database, body: { value }, path: { developerSettingName } }) => {
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
});

export const spawnHeroItem = createController(
  '/developer-settings/:heroId/spawn-item',
  'patch',
)(({ database, body: { itemId, amount = 1 }, path: { heroId } }) => {
  database.exec({
    sql: `
      INSERT INTO
        hero_inventory (hero_id, item_id, amount)
      VALUES
        ($heroId, $itemId, $amount)
      ON CONFLICT (hero_id, item_id) DO UPDATE SET
        amount = amount + $amount
    `,
    bind: {
      $heroId: heroId,
      $itemId: itemId,
      $amount: amount,
    },
  });
});

export const updateVillageResources = createController(
  '/developer-settings/:villageId/resources',
  'patch',
)(({ database, body, path: { villageId } }) => {
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
});

export const incrementHeroAdventurePoints = createController(
  '/developer-settings/:heroId/increment-adventure-points',
  'patch',
)(({ database, path: { heroId } }) => {
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
});
