import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import * as schedulerSignal from '../../scheduler/scheduler-signal';
import {
  incrementHeroAdventurePoints,
  type SpawnHeroItemBody,
  spawnHeroItem,
  type UpdateDeveloperSettingsBody,
  updateDeveloperSettings,
} from '../developer-tools-controllers';
import { createControllerArgs } from './utils/controller-args';

vi.mock('../../scheduler/scheduler-signal', async () => {
  const actual = await vi.importActual<typeof schedulerSignal>(
    '../../scheduler/scheduler-signal',
  );
  return {
    ...actual,
    triggerKick: vi.fn(),
  };
});

describe('developer-tools-controllers', () => {
  const playerId = PLAYER_ID;

  describe(updateDeveloperSettings, () => {
    test('should update setting in database', async () => {
      const database = await prepareTestDatabase();

      updateDeveloperSettings(
        database,
        createControllerArgs<
          '/developer-settings/:developerSettingName',
          'patch',
          UpdateDeveloperSettingsBody
        >({
          params: {
            developerSettingName: 'isInstantBuildingConstructionEnabled',
          },
          body: { value: true },
        }),
      );

      const settings = database.selectObject({
        sql: 'SELECT is_instant_building_construction_enabled FROM developer_settings',
        schema: z.object({
          is_instant_building_construction_enabled: z.number(),
        }),
      })!;

      expect(settings.is_instant_building_construction_enabled).toBe(1);
    });

    test('should instantly finish building events when isInstantBuildingConstructionEnabled is set to true', async () => {
      const database = await prepareTestDatabase();
      const now = Date.now();

      // Insert some events
      database.exec({
        sql: "INSERT INTO events (type, starts_at, duration, village_id) VALUES ('buildingLevelChange', $now + 1000, 5000, 1), ('buildingScheduledConstruction', $now + 2000, 6000, 1), ('buildingConstruction', $now + 3000, 7000, 1), ('buildingDestruction', $now + 4000, 8000, 1), ('unitResearch', $now + 5000, 9000, 1)",
        bind: { $now: now },
      });

      updateDeveloperSettings(
        database,
        createControllerArgs<
          '/developer-settings/:developerSettingName',
          'patch',
          UpdateDeveloperSettingsBody
        >({
          params: {
            developerSettingName: 'isInstantBuildingConstructionEnabled',
          },
          body: { value: true },
        }),
      );

      const events = database.selectObjects({
        sql: 'SELECT type, duration FROM events ORDER BY type',
        schema: z.object({ type: z.string(), duration: z.number() }),
      });

      expect(
        events.find((e) => e.type === 'buildingLevelChange')?.duration,
      ).toBe(0);
      expect(
        events.find((e) => e.type === 'buildingScheduledConstruction')
          ?.duration,
      ).toBe(0);
      expect(
        events.find((e) => e.type === 'buildingConstruction')?.duration,
      ).toBe(0);
      expect(
        events.find((e) => e.type === 'buildingDestruction')?.duration,
      ).toBe(0);
      expect(events.find((e) => e.type === 'unitResearch')?.duration).toBe(
        9000,
      );
      expect(schedulerSignal.triggerKick).toHaveBeenCalled();
    });

    test('should instantly finish training events when isInstantUnitTrainingEnabled is set to true', async () => {
      const database = await prepareTestDatabase();
      const now = Date.now();

      database.exec({
        sql: "INSERT INTO events (type, starts_at, duration, village_id) VALUES ('troopTraining', $now + 1000, 5000, 1)",
        bind: { $now: now },
      });

      updateDeveloperSettings(
        database,
        createControllerArgs<
          '/developer-settings/:developerSettingName',
          'patch',
          UpdateDeveloperSettingsBody
        >({
          params: { developerSettingName: 'isInstantUnitTrainingEnabled' },
          body: { value: true },
        }),
      );

      const events = database.selectObjects({
        sql: "SELECT duration FROM events WHERE type = 'troopTraining'",
        schema: z.object({ duration: z.number() }),
      });

      expect(events[0].duration).toBe(0);
    });

    test('should instantly finish improvement events when isInstantUnitImprovementEnabled is set to true', async () => {
      const database = await prepareTestDatabase();
      const now = Date.now();

      database.exec({
        sql: "INSERT INTO events (type, starts_at, duration, village_id) VALUES ('unitImprovement', $now + 1000, 5000, 1)",
        bind: { $now: now },
      });

      updateDeveloperSettings(
        database,
        createControllerArgs<
          '/developer-settings/:developerSettingName',
          'patch',
          UpdateDeveloperSettingsBody
        >({
          params: { developerSettingName: 'isInstantUnitImprovementEnabled' },
          body: { value: true },
        }),
      );

      const events = database.selectObjects({
        sql: "SELECT duration FROM events WHERE type = 'unitImprovement'",
        schema: z.object({ duration: z.number() }),
      });

      expect(events[0].duration).toBe(0);
    });

    test('should instantly finish research events when isInstantUnitResearchEnabled is set to true', async () => {
      const database = await prepareTestDatabase();
      const now = Date.now();

      database.exec({
        sql: "INSERT INTO events (type, starts_at, duration, village_id) VALUES ('unitResearch', $now + 1000, 5000, 1)",
        bind: { $now: now },
      });

      updateDeveloperSettings(
        database,
        createControllerArgs<
          '/developer-settings/:developerSettingName',
          'patch',
          UpdateDeveloperSettingsBody
        >({
          params: { developerSettingName: 'isInstantUnitResearchEnabled' },
          body: { value: true },
        }),
      );

      const events = database.selectObjects({
        sql: "SELECT duration FROM events WHERE type = 'unitResearch'",
        schema: z.object({ duration: z.number() }),
      });

      expect(events[0].duration).toBe(0);
    });

    test('should instantly finish travel events when isInstantUnitTravelEnabled is set to true', async () => {
      const database = await prepareTestDatabase();
      const now = Date.now();

      database.exec({
        sql: "INSERT INTO events (type, starts_at, duration, village_id) VALUES ('troopMovement', $now + 1000, 5000, 1)",
        bind: { $now: now },
      });

      updateDeveloperSettings(
        database,
        createControllerArgs<
          '/developer-settings/:developerSettingName',
          'patch',
          UpdateDeveloperSettingsBody
        >({
          params: { developerSettingName: 'isInstantUnitTravelEnabled' },
          body: { value: true },
        }),
      );

      const events = database.selectObjects({
        sql: "SELECT duration FROM events WHERE type = 'troopMovement'",
        schema: z.object({ duration: z.number() }),
      });

      expect(events[0].duration).toBe(0);
    });
  });

  describe(spawnHeroItem, () => {
    test('should add item to hero inventory', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
        bind: { $playerId: playerId },
        schema: z.object({ id: z.number() }),
      })!;
      const heroId = hero.id;

      spawnHeroItem(
        database,
        createControllerArgs<
          '/developer-settings/:heroId/spawn-item',
          'patch',
          SpawnHeroItemBody
        >({
          params: { heroId },
          body: { itemId: 1 },
        }),
      );

      const inventory = database.selectObjects({
        sql: 'SELECT item_id, amount FROM hero_inventory WHERE hero_id = $heroId',
        bind: { $heroId: heroId },
        schema: z.object({ item_id: z.number(), amount: z.number() }),
      });

      expect(inventory).toContainEqual({ item_id: 1, amount: 1 });

      // Spawn again
      spawnHeroItem(
        database,
        createControllerArgs<
          '/developer-settings/:heroId/spawn-item',
          'patch',
          SpawnHeroItemBody
        >({
          params: { heroId },
          body: { itemId: 1 },
        }),
      );

      const inventoryUpdated = database.selectObjects({
        sql: 'SELECT item_id, amount FROM hero_inventory WHERE hero_id = $heroId',
        bind: { $heroId: heroId },
        schema: z.object({ item_id: z.number(), amount: z.number() }),
      });

      expect(inventoryUpdated).toContainEqual({
        item_id: 1,
        amount: 2,
      });
    });
  });

  describe(incrementHeroAdventurePoints, () => {
    test('should increment hero adventure points', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
        bind: { $playerId: playerId },
        schema: z.object({ id: z.number() }),
      })!;
      const heroId = hero.id;

      // Initial points (should be 0 or some seeded value)
      const initialPoints = database.selectObject({
        sql: 'SELECT available FROM hero_adventures WHERE hero_id = $heroId',
        bind: { $heroId: heroId },
        schema: z.object({ available: z.number() }),
      })!.available;

      incrementHeroAdventurePoints(
        database,
        createControllerArgs<
          '/developer-settings/:heroId/increment-adventure-points',
          'patch'
        >({
          params: { heroId },
        }),
      );

      const points = database.selectObject({
        sql: 'SELECT available FROM hero_adventures WHERE hero_id = $heroId',
        bind: { $heroId: heroId },
        schema: z.object({ available: z.number() }),
      })!;

      expect(points.available).toBe(initialPoints + 1);
    });
  });
});
