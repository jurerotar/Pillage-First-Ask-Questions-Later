import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import * as schedulerSignal from '../../scheduler/scheduler-signal';
import {
  incrementHeroAdventurePoints,
  levelUpHero,
  spawnHeroItem,
  updateDeveloperSettings,
} from '../developer-tools-controllers';
import { createControllerArgs } from './utils/controller-args';

vi.mock<typeof import('../../scheduler/scheduler-signal')>(
  import('../../scheduler/scheduler-signal'),
  async () => {
    const actual = await vi.importActual<typeof schedulerSignal>(
      '../../scheduler/scheduler-signal',
    );
    return {
      ...actual,
      triggerKick: vi.fn(),
    };
  },
);

describe('developer-tools-controllers', () => {
  const playerId = PLAYER_ID;

  describe(updateDeveloperSettings, () => {
    test('should update setting in database', async () => {
      const database = await prepareTestDatabase();

      updateDeveloperSettings(
        database,
        createControllerArgs<
          '/developer-settings/:developerSettingName',
          'patch'
        >({
          path: {
            developerSettingName: 'isInstantBuildingConstructionEnabled',
          },
          body: { value: true },
        }),
      );

      const settings = database.selectObject({
        sql: 'SELECT is_instant_building_construction_enabled FROM developer_settings',
        schema: z.strictObject({
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
          'patch'
        >({
          path: {
            developerSettingName: 'isInstantBuildingConstructionEnabled',
          },
          body: { value: true },
        }),
      );

      const events = database.selectObjects({
        sql: 'SELECT type, duration FROM events ORDER BY type',
        schema: z.strictObject({ type: z.string(), duration: z.number() }),
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
          'patch'
        >({
          path: { developerSettingName: 'isInstantUnitTrainingEnabled' },
          body: { value: true },
        }),
      );

      const events = database.selectObjects({
        sql: "SELECT duration FROM events WHERE type = 'troopTraining'",
        schema: z.strictObject({ duration: z.number() }),
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
          'patch'
        >({
          path: { developerSettingName: 'isInstantUnitImprovementEnabled' },
          body: { value: true },
        }),
      );

      const events = database.selectObjects({
        sql: "SELECT duration FROM events WHERE type = 'unitImprovement'",
        schema: z.strictObject({ duration: z.number() }),
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
          'patch'
        >({
          path: { developerSettingName: 'isInstantUnitResearchEnabled' },
          body: { value: true },
        }),
      );

      const events = database.selectObjects({
        sql: "SELECT duration FROM events WHERE type = 'unitResearch'",
        schema: z.strictObject({ duration: z.number() }),
      });

      expect(events[0].duration).toBe(0);
    });

    test('should instantly finish travel events when isInstantUnitTravelEnabled is set to true', async () => {
      const database = await prepareTestDatabase();
      const now = Date.now();

      database.exec({
        sql: "INSERT INTO events (type, starts_at, duration, village_id) VALUES ('troopMovementAdventure', $now + 1000, 5000, 1)",
        bind: { $now: now },
      });

      updateDeveloperSettings(
        database,
        createControllerArgs<
          '/developer-settings/:developerSettingName',
          'patch'
        >({
          path: { developerSettingName: 'isInstantUnitTravelEnabled' },
          body: { value: true },
        }),
      );

      const events = database.selectObjects({
        sql: "SELECT duration FROM events WHERE type = 'troopMovementAdventure'",
        schema: z.strictObject({ duration: z.number() }),
      });

      expect(events[0].duration).toBe(0);
    });
  });

  describe(spawnHeroItem, () => {
    test('should add item to hero inventory', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.strictObject({ id: z.number() }),
      })!;
      const heroId = hero.id;

      spawnHeroItem(
        database,
        createControllerArgs<'/developer-settings/:heroId/spawn-item', 'patch'>(
          {
            path: { heroId },
            body: { itemId: 1, amount: 1 },
          },
        ),
      );

      const inventory = database.selectObjects({
        sql: 'SELECT item_id, amount FROM hero_inventory WHERE hero_id = $hero_id',
        bind: { $hero_id: heroId },
        schema: z.strictObject({ item_id: z.number(), amount: z.number() }),
      });

      expect(inventory).toContainEqual({ item_id: 1, amount: 1 });

      // Spawn again
      spawnHeroItem(
        database,
        createControllerArgs<'/developer-settings/:heroId/spawn-item', 'patch'>(
          {
            path: { heroId },
            body: { itemId: 1, amount: 1 },
          },
        ),
      );

      const inventoryUpdated = database.selectObjects({
        sql: 'SELECT item_id, amount FROM hero_inventory WHERE hero_id = $hero_id',
        bind: { $hero_id: heroId },
        schema: z.strictObject({ item_id: z.number(), amount: z.number() }),
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
        sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.strictObject({ id: z.number() }),
      })!;
      const heroId = hero.id;

      // Initial points (should be 0 or some seeded value)
      const initialPoints = database.selectObject({
        sql: 'SELECT available FROM hero_adventures WHERE hero_id = $hero_id',
        bind: { $hero_id: heroId },
        schema: z.strictObject({ available: z.number() }),
      })!.available;

      incrementHeroAdventurePoints(
        database,
        createControllerArgs<
          '/developer-settings/:heroId/increment-adventure-points',
          'patch'
        >({
          path: { heroId },
        }),
      );

      const points = database.selectObject({
        sql: 'SELECT available FROM hero_adventures WHERE hero_id = $hero_id',
        bind: { $hero_id: heroId },
        schema: z.strictObject({ available: z.number() }),
      })!;

      expect(points.available).toBe(initialPoints + 1);
    });
  });

  describe(levelUpHero, () => {
    test('should level up hero by increasing experience to next level', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id, experience FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.strictObject({ id: z.number(), experience: z.number() }),
      })!;
      const heroId = hero.id;

      levelUpHero(
        database,
        createControllerArgs<'/developer-settings/:heroId/level-up', 'patch'>({
          path: { heroId },
        }),
      );

      const updatedHero = database.selectObject({
        sql: 'SELECT experience FROM heroes WHERE id = $hero_id',
        bind: { $hero_id: heroId },
        schema: z.strictObject({ experience: z.number() }),
      })!;

      // exp for level 0 is 0. nextLevelExp for level 0 is (0+1)*(0+2)*25 = 50
      expect(updatedHero.experience).toBe(50);

      // Level up again
      levelUpHero(
        database,
        createControllerArgs<'/developer-settings/:heroId/level-up', 'patch'>({
          path: { heroId },
        }),
      );

      const updatedHeroAgain = database.selectObject({
        sql: 'SELECT experience FROM heroes WHERE id = $hero_id',
        bind: { $hero_id: heroId },
        schema: z.strictObject({ experience: z.number() }),
      })!;

      // exp for level 1 is 50. nextLevelExp for level 1 is (1+1)*(1+2)*25 = 150
      expect(updatedHeroAgain.experience).toBe(150);
    });
  });
});
