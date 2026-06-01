import { snakeCase } from 'moderndash';
import { z } from 'zod';
import { calculateHeroLevel } from '@pillage-first/game-assets/utils/hero';
import { developerSettingsSchema } from '@pillage-first/types/models/developer-settings';
import type { GameEventType } from '@pillage-first/types/models/game-event';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { materializeHeroAdventurePointsAt } from '../../utils/adventures';
import { onHeroDeath } from '../../utils/hero';
import {
  addVillageResourcesAt,
  subtractVillageResourcesAt,
} from '../../utils/village';
import { createController } from '../controller';
import { triggerKick } from '../events/scheduler/scheduler-signal';
import { mapDeveloperSettingsRowToDto } from './mappers/developer-tools-mapper';
import { getDeveloperSettingsRowSchema } from './schemas/developer-tools-schemas';

export const getDeveloperSettings = createController('/developer-settings', {
  summary: 'Get developer settings',
  response: developerSettingsSchema,
})(({ database }) => {
  const row = database.selectObject({
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
        is_free_unit_research_enabled,
        is_instant_hero_revive_enabled,
        is_free_hero_revive_enabled
      FROM
        developer_settings
    `,
    schema: getDeveloperSettingsRowSchema,
  })!;

  return mapDeveloperSettingsRowToDto(row);
});

export const updateDeveloperSettings = createController(
  '/developer-settings/:developerSettingName',
  'patch',
  {
    summary: 'Update developer setting',
    requestParams: {
      path: z.strictObject({
        developerSettingName: z.string(),
      }),
    },
    requestBody: z.strictObject({
      value: z.boolean(),
    }),
  },
)(({ database, body: { value }, path: { developerSettingName } }) => {
  const column = snakeCase(developerSettingName);

  database.exec({
    sql: `
      UPDATE developer_settings
      SET
        ${column} = $value
    `,
    bind: {
      $value: value ? 1 : 0,
    },
  });

  if (value) {
    let eventTypes: GameEventType[] = [];

    switch (developerSettingName) {
      case 'isInstantBuildingConstructionEnabled': {
        eventTypes = [
          'buildingLevelChange',
          'buildingScheduledConstruction',
          'buildingConstruction',
          'buildingDestruction',
        ];
        break;
      }
      case 'isInstantUnitTrainingEnabled': {
        eventTypes = ['troopTraining'];
        break;
      }
      case 'isInstantUnitImprovementEnabled': {
        eventTypes = ['unitImprovement'];
        break;
      }
      case 'isInstantUnitResearchEnabled': {
        eventTypes = ['unitResearch'];
        break;
      }
      case 'isInstantUnitTravelEnabled': {
        eventTypes = [
          'troopMovementReinforcements',
          'troopMovementRelocation',
          'troopMovementReturn',
          'troopMovementFindNewVillage',
          'troopMovementAttack',
          'troopMovementRaid',
          'troopMovementOasisOccupation',
          'troopMovementAdventure',
        ];
        break;
      }
      case 'isInstantHeroReviveEnabled': {
        eventTypes = ['heroRevival'];
        break;
      }
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

export const levelUpHero = createController(
  '/developer-settings/:heroId/level-up',
  'patch',
  {
    summary: 'Level up hero',
    requestParams: {
      path: z.strictObject({
        heroId: z.coerce.number(),
      }),
    },
  },
)(({ database, path: { heroId } }) => {
  const currentExperience = database.selectValue({
    sql: 'SELECT experience FROM heroes WHERE id = $hero_id',
    bind: { $hero_id: heroId },
    schema: z.number(),
  })!;

  const { expToNextLevel } = calculateHeroLevel(currentExperience);

  database.exec({
    sql: `
      UPDATE heroes
      SET
        experience = $nextLevelExp
      WHERE
        id = $hero_id
    `,
    bind: {
      $hero_id: heroId,
      $nextLevelExp: currentExperience + expToNextLevel,
    },
  });
});

export const spawnHeroItem = createController(
  '/developer-settings/:heroId/spawn-item',
  'patch',
  {
    summary: 'Spawn hero item',
    requestParams: {
      path: z.strictObject({
        heroId: z.coerce.number(),
      }),
    },
    requestBody: z.strictObject({
      itemId: z.number(),
      amount: z.number(),
    }),
  },
)(({ database, body: { itemId, amount = 1 }, path: { heroId } }) => {
  database.exec({
    sql: `
      INSERT INTO
        hero_inventory (hero_id, item_id, amount)
      VALUES
        ($hero_id, $itemId, $amount)
      ON CONFLICT (hero_id, item_id) DO UPDATE SET
        amount = amount + $amount
    `,
    bind: {
      $hero_id: heroId,
      $itemId: itemId,
      $amount: amount,
    },
  });
});

export const updateVillageResources = createController(
  '/developer-settings/:villageId/resources',
  'patch',
  {
    summary: 'Update village resources',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    requestBody: z.strictObject({
      resource: resourceSchema,
      amount: z.number(),
      direction: z.enum(['add', 'subtract']),
    }),
  },
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
  {
    summary: 'Increment hero adventure points',
    requestParams: {
      path: z.strictObject({
        heroId: z.coerce.number(),
      }),
    },
  },
)(({ database, path: { heroId } }) => {
  const now = Date.now();

  materializeHeroAdventurePointsAt(database, heroId, now);

  database.exec({
    sql: `
      UPDATE hero_adventures
      SET
        available = available + 1,
        last_updated_at = $now
      WHERE
        hero_id = $hero_id
    `,
    bind: {
      $hero_id: heroId,
      $now: now,
    },
  });
});

export const killHero = createController(
  '/developer-settings/:heroId/kill',
  'patch',
  {
    summary: 'Kill hero',
    requestParams: {
      path: z.strictObject({
        heroId: z.coerce.number(),
      }),
    },
  },
)(({ database, path: { heroId } }) => {
  const heroInTroops = database.selectValue({
    sql: `
      SELECT
        1
      FROM
        troops
      WHERE
        unit_id = (SELECT id FROM unit_ids WHERE unit = 'HERO')
        AND tile_id = source_tile_id
    `,
    schema: z.number().optional(),
  });

  if (!heroInTroops) {
    throw new Error('Hero must be at home to be killed');
  }

  const now = Date.now();

  database.exec({
    sql: `
      UPDATE heroes
      SET
        health = 0
      WHERE
        id = $hero_id
    `,
    bind: {
      $hero_id: heroId,
    },
  });

  database.exec({
    sql: `
      DELETE FROM
        troops
      WHERE
        unit_id = (SELECT id FROM unit_ids WHERE unit = 'HERO')
        AND tile_id = source_tile_id
    `,
  });

  onHeroDeath(database, now);
});
