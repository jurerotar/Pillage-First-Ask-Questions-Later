import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  createBuildingConstructionEventMock,
  createBuildingDestructionEventMock,
  createBuildingLevelChangeEventMock,
  createGameEventMock,
  createTroopMovementAdventureEventMock,
  createTroopTrainingEventMock,
  createUnitImprovementEventMock,
  createUnitResearchEventMock,
} from '@pillage-first/mocks/event';
import { insertEvents } from '../../../utils/events';
import {
  cancelScheduling,
  resetSchedulerForTesting,
  scheduleNextEvent,
} from '../../events/scheduler/scheduler';
import { createSchedulerDataSource } from '../../events/scheduler/scheduler-data-source';
import {
  adjustVillageLoyalty,
  incrementHeroAdventurePoints,
  levelUpHero,
  spawnHeroItem,
  updateDeveloperSettings,
} from '../developer-tools-controllers';
import { startHeroAdventure } from '../hero-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('developer-tools-controllers', () => {
  const playerId = PLAYER_ID;

  describe(adjustVillageLoyalty, () => {
    test('should create the first loyaltyIncrease event when loyalty is adjusted', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(1_000_000);

      try {
        const database = await prepareTestDatabase();
        const tileId = database.selectValue({
          sql: 'SELECT tile_id FROM villages WHERE id = 1',
          schema: z.number(),
        })!;

        const eventCountBefore = database.selectValue({
          sql: "SELECT COUNT(*) FROM events WHERE type = 'loyaltyIncrease';",
          schema: z.number(),
        });

        expect(eventCountBefore).toBe(0);

        adjustVillageLoyalty(
          database,
          createControllerArgs<
            '/developer-settings/:tileId/adjustLoyalty',
            'patch'
          >({
            path: { tileId },
            body: { amount: -10 },
          }),
        );

        const event = database.selectObject({
          sql: "SELECT type, starts_at AS startsAt FROM events WHERE type = 'loyaltyIncrease' LIMIT 1;",
          schema: z.strictObject({
            type: z.string(),
            startsAt: z.number(),
          }),
        })!;

        expect(event).toStrictEqual({
          type: 'loyaltyIncrease',
          startsAt: 1_000_000,
        });
      } finally {
        vi.useRealTimers();
      }
    });
  });

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

      const settings = database.selectValue({
        sql: 'SELECT is_instant_building_construction_enabled FROM developer_settings',
        schema: z.number(),
      })!;

      expect(settings).toBe(1);
    });

    test('should instantly finish building events when isInstantBuildingConstructionEnabled is set to true', async () => {
      const database = await prepareTestDatabase();
      const now = Date.now();

      insertEvents(database, [
        createBuildingLevelChangeEventMock({
          startsAt: now + 1000,
          duration: 5000,
          villageId: 1,
        }),
        createBuildingLevelChangeEventMock({
          startsAt: now + 2000,
          duration: 6000,
          villageId: 1,
        }),
        createBuildingConstructionEventMock({
          startsAt: now + 3000,
          duration: 7000,
          villageId: 1,
        }),
        createBuildingDestructionEventMock({
          startsAt: now + 4000,
          duration: 8000,
          villageId: 1,
        }),
        createUnitResearchEventMock({
          startsAt: now + 5000,
          duration: 9000,
          villageId: 1,
        }),
      ]);

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
        events.find((e) => e.type === 'buildingConstruction')?.duration,
      ).toBe(0);
      expect(
        events.find((e) => e.type === 'buildingDestruction')?.duration,
      ).toBe(0);
      expect(events.find((e) => e.type === 'unitResearch')?.duration).toBe(
        9000,
      );
    });

    test('should instantly finish unit production events when isInstantUnitTrainingEnabled is set to true', async () => {
      const database = await prepareTestDatabase();
      const now = Date.now();

      insertEvents(database, [
        createTroopTrainingEventMock({
          startsAt: now + 1000,
          duration: 5000,
          villageId: 1,
        }),
        createGameEventMock('animalCageProduction', {
          startsAt: now + 2000,
          duration: 6000,
          villageId: 1,
          cageAmount: 3,
        }),
        createGameEventMock('trapperCageProduction', {
          startsAt: now + 3000,
          duration: 7000,
          villageId: 1,
          cageAmount: 4,
        }),
      ]);

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
        sql: `
          SELECT type, duration
          FROM events
          WHERE type IN (
            'troopTraining',
            'animalCageProduction',
            'trapperCageProduction'
          )
        `,
        schema: z.strictObject({ type: z.string(), duration: z.number() }),
      });

      expect(events.find((e) => e.type === 'troopTraining')?.duration).toBe(0);
      expect(
        events.find((e) => e.type === 'animalCageProduction')?.duration,
      ).toBe(0);
      expect(
        events.find((e) => e.type === 'trapperCageProduction')?.duration,
      ).toBe(0);
    });

    test('should instantly finish improvement events when isInstantUnitImprovementEnabled is set to true', async () => {
      const database = await prepareTestDatabase();
      const now = Date.now();

      insertEvents(database, [
        createUnitImprovementEventMock({
          startsAt: now + 1000,
          duration: 5000,
          villageId: 1,
        }),
      ]);

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

      const events = database.selectValues({
        sql: "SELECT duration FROM events WHERE type = 'unitImprovement'",
        schema: z.number(),
      });

      expect(events[0]).toBe(0);
    });

    test('should instantly finish research events when isInstantUnitResearchEnabled is set to true', async () => {
      const database = await prepareTestDatabase();
      const now = Date.now();

      insertEvents(database, [
        createUnitResearchEventMock({
          startsAt: now + 1000,
          duration: 5000,
          villageId: 1,
        }),
      ]);

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

      const events = database.selectValues({
        sql: "SELECT duration FROM events WHERE type = 'unitResearch'",
        schema: z.number(),
      });

      expect(events[0]).toBe(0);
    });

    test('should instantly finish travel and hunting party events when isInstantUnitTravelEnabled is set to true', async () => {
      const database = await prepareTestDatabase();
      const now = Date.now();

      insertEvents(database, [
        createTroopMovementAdventureEventMock({
          startsAt: now + 1000,
          duration: 5000,
          villageId: 1,
        }),
        createGameEventMock('huntersLodgeHunt', {
          startsAt: now + 2000,
          duration: 6000,
          villageId: 1,
          huntingPartyLevel: 1,
        }),
        createGameEventMock('gatherersHutGatheringTrip', {
          startsAt: now + 3000,
          duration: 7000,
          villageId: 1,
          troops: [],
        }),
      ]);

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
        sql: `
          SELECT type, duration
          FROM events
          WHERE type IN ('troopMovementAdventure', 'huntersLodgeHunt', 'gatherersHutGatheringTrip')
        `,
        schema: z.strictObject({ type: z.string(), duration: z.number() }),
      });

      expect(
        events.find((e) => e.type === 'troopMovementAdventure')?.duration,
      ).toBe(0);
      expect(events.find((e) => e.type === 'huntersLodgeHunt')?.duration).toBe(
        0,
      );
      expect(
        events.find((e) => e.type === 'gatherersHutGatheringTrip')?.duration,
      ).toBe(0);
    });

    test('should instantly resolve adventure returns created after enabling instant unit travel', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(1_000_000);
      resetSchedulerForTesting();

      try {
        const database = await prepareTestDatabase();

        const homeVillage = database.selectObject({
          sql: `
            SELECT v.id, v.tile_id AS tileId
            FROM
              heroes h
                JOIN villages v ON v.id = h.village_id
            WHERE
              h.player_id = $player_id;
          `,
          bind: { $player_id: playerId },
          schema: z.strictObject({
            id: z.number(),
            tileId: z.number(),
          }),
        })!;

        database.exec({
          sql: `
            UPDATE hero_adventures
            SET available = 1
            WHERE hero_id = (
              SELECT id
              FROM heroes
              WHERE player_id = $player_id
            );
          `,
          bind: { $player_id: playerId },
        });

        startHeroAdventure(
          database,
          createControllerArgs<'/players/:playerId/hero/adventures', 'post'>({
            path: { playerId },
          }),
        );

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

        scheduleNextEvent(createSchedulerDataSource(database));

        const pendingMovements = database.selectObjects({
          sql: `
            SELECT type, starts_at AS startsAt, duration, resolves_at AS resolvesAt
            FROM events
            WHERE type IN (
              'troopMovementReinforcements',
              'troopMovementRelocation',
              'troopMovementReturn',
              'troopMovementFindNewVillage',
              'troopMovementAttack',
              'troopMovementRaid',
              'troopMovementOasisOccupation',
              'troopMovementAdventure'
            );
          `,
          schema: z.strictObject({
            type: z.string(),
            startsAt: z.number(),
            duration: z.number(),
            resolvesAt: z.number(),
          }),
        });

        const heroTroops = database.selectObjects({
          sql: `
            SELECT
              t.amount,
              t.tile_id AS tileId,
              t.source_tile_id AS sourceTileId
            FROM
              troops t
                JOIN unit_ids ui ON ui.id = t.unit_id
            WHERE
              ui.unit = 'HERO';
          `,
          schema: z.strictObject({
            amount: z.number(),
            tileId: z.number(),
            sourceTileId: z.number(),
          }),
        });

        expect(pendingMovements).toStrictEqual([]);
        expect(heroTroops).toStrictEqual([
          {
            amount: 1,
            tileId: homeVillage.tileId,
            sourceTileId: homeVillage.tileId,
          },
        ]);
      } finally {
        cancelScheduling();
        vi.useRealTimers();
      }
    });
  });

  describe(spawnHeroItem, () => {
    test('should add item to hero inventory', async () => {
      const database = await prepareTestDatabase();

      const heroId = database.selectValue({
        sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.number(),
      })!;

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
      const now = 9 * 60 * 60 * 1000;

      vi.useFakeTimers();
      vi.setSystemTime(new Date(now));

      const heroId = database.selectValue({
        sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.number(),
      })!;

      database.exec({
        sql: `
          UPDATE servers
          SET created_at = 0
        `,
      });

      database.exec({
        sql: `
          UPDATE hero_adventures
          SET last_updated_at = 0
          WHERE hero_id = $hero_id
        `,
        bind: { $hero_id: heroId },
      });

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
        sql: 'SELECT available, last_updated_at AS lastUpdatedAt FROM hero_adventures WHERE hero_id = $hero_id',
        bind: { $hero_id: heroId },
        schema: z.strictObject({
          available: z.number(),
          lastUpdatedAt: z.number(),
        }),
      })!;

      expect(points.available).toBe(5);
      expect(points.lastUpdatedAt).toBe(now);

      vi.useRealTimers();
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

      const updatedHero = database.selectValue({
        sql: 'SELECT experience FROM heroes WHERE id = $hero_id',
        bind: { $hero_id: heroId },
        schema: z.number(),
      })!;

      // exp for level 0 is 0. nextLevelExp for level 0 is (0+1)*(0+2)*25 = 50
      expect(updatedHero).toBe(50);

      // Level up again
      levelUpHero(
        database,
        createControllerArgs<'/developer-settings/:heroId/level-up', 'patch'>({
          path: { heroId },
        }),
      );

      const updatedHeroAgain = database.selectValue({
        sql: 'SELECT experience FROM heroes WHERE id = $hero_id',
        bind: { $hero_id: heroId },
        schema: z.number(),
      })!;

      // exp for level 1 is 50. nextLevelExp for level 1 is (1+1)*(1+2)*25 = 150
      expect(updatedHeroAgain).toBe(150);
    });
  });
});
