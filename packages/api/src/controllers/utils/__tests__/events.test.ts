import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  calculateHeroLevel,
  calculateHeroRevivalCost,
  calculateHeroRevivalTime,
} from '@pillage-first/game-assets/hero/utils';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  createBuildingLevelChangeEventMock,
  createGameEventMock,
  createTroopTrainingEventMock,
  createUnitImprovementEventMock,
  createUnitResearchEventMock,
} from '@pillage-first/mocks/event';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { playableTribeSchema } from '@pillage-first/types/models/tribe';
import type { Unit } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  getEventCost,
  getEventDuration,
  getEventStartTime,
  insertEvents,
  runEventCreationSideEffects,
  validateEventCreationPrerequisites,
} from '../events';

const getAnyVillageId = (database: DbFacade): number => {
  return database.selectValue({
    sql: 'SELECT id FROM villages LIMIT 1;',
    schema: z.number(),
  })!;
};

const setDevFlag = (database: DbFacade, column: string, value: number) => {
  database.exec({
    sql: `UPDATE developer_settings SET ${column} = $value`,
    bind: { $value: value },
  });
};

describe('events utils', () => {
  describe(validateEventCreationPrerequisites, () => {
    test('unitImprovement - should return false if smithy is busy', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const startsAt = 1_000;
      const duration = 500;
      insertEvents(database, [
        createUnitImprovementEventMock({
          id: 99_001,
          villageId,
          startsAt,
          duration,
        }),
      ]);

      const result = validateEventCreationPrerequisites(
        database,
        createUnitImprovementEventMock({
          villageId,
        }),
      );

      expect(result).toEqual([false, 'Smithy is busy']);
    });

    test('unitImprovement - should return true if smithy is idle', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const result = validateEventCreationPrerequisites(database, {
        type: 'unitImprovement',
        villageId,
      } as GameEvent<'unitImprovement'>);

      expect(result).toEqual([true, null]);
    });

    test('unitResearch - should return false if academy is busy', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const startsAt = 2_000;
      const duration = 500;
      insertEvents(database, [
        createUnitResearchEventMock({
          id: 99_101,
          villageId,
          startsAt,
          duration,
        }),
      ]);

      const result = validateEventCreationPrerequisites(
        database,
        createUnitResearchEventMock({
          villageId,
        }),
      );

      expect(result).toEqual([false, 'Academy is busy']);
    });

    test('unitResearch - should return false if unit is already researched', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `INSERT INTO unit_research (village_id, unit_id)
              VALUES ($villageId, (SELECT id FROM unit_ids WHERE unit = $unit))`,
        bind: { $villageId: villageId, $unit: 'LEGIONNAIRE' },
      });

      const result = validateEventCreationPrerequisites(
        database,
        createUnitResearchEventMock({
          villageId,
        }),
      );

      expect(result).toEqual([false, 'Unit is already researched']);
    });

    test('unitResearch - should return true if academy idle and unit not researched', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      database.exec({
        sql: `DELETE FROM unit_research
              WHERE village_id = $villageId AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit)`,
        bind: { $villageId: villageId, $unit: 'LEGIONNAIRE' },
      });

      const result = validateEventCreationPrerequisites(
        database,
        createUnitResearchEventMock({
          villageId,
        }),
      );

      expect(result).toEqual([true, null]);
    });

    test('troopTraining - should return false if unit is not researched', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      database.exec({
        sql: `DELETE FROM unit_research
              WHERE village_id = $villageId AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit)`,
        bind: { $villageId: villageId, $unit: 'LEGIONNAIRE' },
      });

      const event = createTroopTrainingEventMock({
        villageId,
      });

      const result = validateEventCreationPrerequisites(database, event);
      expect(result).toEqual([false, 'Unit is not researched']);
    });

    test('other events - should return true by default', async () => {
      const database = await prepareTestDatabase();
      const result = validateEventCreationPrerequisites(
        database,
        createGameEventMock('buildingLevelChange'),
      );
      expect(result).toEqual([true, null]);
    });

    test('heroRevival - should return false if hero is already alive', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: 'UPDATE heroes SET health = 100 WHERE player_id = $playerId',
        bind: { $playerId: PLAYER_ID },
      });

      const result = validateEventCreationPrerequisites(database, {
        type: 'heroRevival',
        villageId,
      } as GameEvent<'heroRevival'>);

      expect(result).toEqual([false, 'Hero is already alive']);
    });

    test('heroRevival - should return true if hero is dead', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: 'UPDATE heroes SET health = 0 WHERE player_id = $playerId',
        bind: { $playerId: PLAYER_ID },
      });

      const result = validateEventCreationPrerequisites(database, {
        type: 'heroRevival',
        villageId,
      } as GameEvent<'heroRevival'>);

      expect(result).toEqual([true, null]);
    });
  });

  describe(runEventCreationSideEffects, () => {
    test('troopMovement - should remove troops for movements', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const villageTileId = database.selectValue({
        sql: 'SELECT tile_id FROM villages WHERE id = $villageId',
        bind: { $villageId: villageId },
        schema: z.number(),
      })!;

      // Seed some troops
      database.exec({
        sql: `INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
              VALUES ((SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 100, $tileId, $tileId)`,
        bind: { $tileId: villageTileId },
      });

      const event = createGameEventMock('troopMovementAttack', {
        villageId,
        troops: [
          {
            unitId: 'LEGIONNAIRE',
            amount: 40,
            tileId: villageTileId,
            source: villageTileId,
          },
        ],
      });

      runEventCreationSideEffects(database, [event]);

      const amount = database.selectValue({
        sql: "SELECT amount FROM troops WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE')",
        schema: z.number(),
      });

      expect(amount).toBe(60);
    });

    test('troopMovement - should remove troops for multiple movements', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const villageTileId = database.selectValue({
        sql: 'SELECT tile_id FROM villages WHERE id = $villageId',
        bind: { $villageId: villageId },
        schema: z.number(),
      })!;

      // Seed some troops
      database.exec({
        sql: `INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
              VALUES ((SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 100, $tileId, $tileId)`,
        bind: { $tileId: villageTileId },
      });
      database.exec({
        sql: `INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
              VALUES ((SELECT id FROM unit_ids WHERE unit = 'PRAETORIAN'), 100, $tileId, $tileId)`,
        bind: { $tileId: villageTileId },
      });

      const events = [
        createGameEventMock('troopMovementAttack', {
          villageId,
          troops: [
            {
              unitId: 'LEGIONNAIRE',
              amount: 40,
              tileId: villageTileId,
              source: villageTileId,
            },
          ],
        }),
        createGameEventMock('troopMovementRaid', {
          villageId,
          troops: [
            {
              unitId: 'PRAETORIAN',
              amount: 60,
              tileId: villageTileId,
              source: villageTileId,
            },
          ],
        }),
      ];

      runEventCreationSideEffects(database, events);

      const getAmount = (unit: Unit['id']) =>
        database.selectValue({
          sql: 'SELECT amount FROM troops WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = $unit)',
          bind: { $unit: unit },
          schema: z.number(),
        });

      expect(getAmount('LEGIONNAIRE')).toBe(60);
      expect(getAmount('PRAETORIAN')).toBe(40);
    });
  });

  describe(getEventCost, () => {
    test('buildingLevelUp - should return zero cost if free building construction enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_free_building_construction_enabled', 1);
      const event = createBuildingLevelChangeEventMock();

      const result = getEventCost(database, event);
      expect(result).toEqual([0, 0, 0, 0]);
    });

    test('buildingLevelUp - should return non-zero cost if free building construction disabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_free_building_construction_enabled', 0);
      const event = createBuildingLevelChangeEventMock();

      const result = getEventCost(database, event);
      expect(result.length).toBe(4);
      expect(result.some((v) => v > 0)).toBeTruthy();
    });

    test('unitResearch - should return zero cost if free unit research enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_free_unit_research_enabled', 1);
      const event = createUnitResearchEventMock();
      expect(getEventCost(database, event)).toEqual([0, 0, 0, 0]);
    });

    test('unitImprovement - should return zero cost if free unit improvement enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_free_unit_improvement_enabled', 1);
      const event = createUnitImprovementEventMock();
      expect(getEventCost(database, event)).toEqual([0, 0, 0, 0]);
    });

    test('troopTraining - should return zero cost if free unit training enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_free_unit_training_enabled', 1);
      const event = createTroopTrainingEventMock({
        amount: 10,
      });
      expect(getEventCost(database, event)).toEqual([0, 0, 0, 0]);
    });

    test('troopTraining - should return tripled cost for Great Barracks vs Barracks', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_free_unit_training_enabled', 0);
      const baseEvent = createTroopTrainingEventMock({
        amount: 10,
      });
      const greatEvent = {
        ...baseEvent,
        buildingId: 'GREAT_BARRACKS',
      } as GameEvent<'troopTraining'>;

      const baseCost = getEventCost(database, baseEvent);
      const greatCost = getEventCost(database, greatEvent);

      expect(greatCost).toEqual(baseCost.map((v) => v * 3));
    });

    test('heroRevival - should return correct cost', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const { experience, tribe } = database.selectObject({
        sql: `
          SELECT h.experience, ti.tribe
          FROM
            heroes h
              JOIN players p ON h.player_id = p.id
              JOIN tribe_ids ti ON p.tribe_id = ti.id
          WHERE
            h.player_id = $playerId;
        `,
        bind: { $playerId: PLAYER_ID },
        schema: z.strictObject({
          experience: z.number(),
          tribe: playableTribeSchema,
        }),
      })!;

      const { level } = calculateHeroLevel(experience);
      const expectedCost = calculateHeroRevivalCost(tribe, level);

      const result = getEventCost(database, {
        type: 'heroRevival',
        villageId,
      } as GameEvent<'heroRevival'>);

      expect(result).toEqual(expectedCost);
    });

    test('heroRevival - should return zero cost if free hero revival enabled', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      setDevFlag(database, 'is_free_hero_revive_enabled', 1);

      const result = getEventCost(database, {
        type: 'heroRevival',
        villageId,
      } as GameEvent<'heroRevival'>);

      expect(result).toEqual([0, 0, 0, 0]);
    });
  });

  describe(getEventDuration, () => {
    test('buildingConstruction - should return 0', async () => {
      const database = await prepareTestDatabase();
      const event = createGameEventMock('buildingConstruction');
      expect(getEventDuration(database, event)).toBe(0);
    });

    test('buildingLevelUp - should return 0 if instant construction enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_building_construction_enabled', 1);
      const event = createBuildingLevelChangeEventMock({
        villageId: getAnyVillageId(database),
      });
      expect(getEventDuration(database, event)).toBe(0);
    });

    test('unitResearch - should return 0 if instant research enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_unit_research_enabled', 1);
      const event = createUnitResearchEventMock({
        villageId: getAnyVillageId(database),
      });
      expect(getEventDuration(database, event)).toBe(0);
    });

    test('unitImprovement - should return 0 if instant improvement enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_unit_improvement_enabled', 1);
      const event = createUnitImprovementEventMock({
        villageId: getAnyVillageId(database),
      });
      expect(getEventDuration(database, event)).toBe(0);
    });

    test('troopTraining - should return 0 if instant training enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_unit_training_enabled', 1);
      const event = createTroopTrainingEventMock({
        villageId: getAnyVillageId(database),
        amount: 10,
      });
      expect(getEventDuration(database, event)).toBe(0);
    });

    test('buildingLevelUp - should apply effects and return a positive duration', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_building_construction_enabled', 0);
      const event = createBuildingLevelChangeEventMock({
        villageId: getAnyVillageId(database),
      });
      const result = getEventDuration(database, event);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    test('unitResearch - should apply effects and return a positive duration', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_unit_research_enabled', 0);
      const event = createUnitResearchEventMock({
        villageId: getAnyVillageId(database),
      });
      const result = getEventDuration(database, event);
      expect(result).toBeGreaterThan(0);
    });

    test('unitImprovement - should apply effects and return a positive duration', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_unit_improvement_enabled', 0);
      const event = createUnitImprovementEventMock({
        villageId: getAnyVillageId(database),
      });
      const result = getEventDuration(database, event);
      expect(result).toBeGreaterThan(0);
    });

    test('troopTraining - should apply effects and return a positive duration', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_unit_training_enabled', 0);
      const event = createTroopTrainingEventMock({
        villageId: getAnyVillageId(database),
        amount: 10,
      });
      const result = getEventDuration(database, event);
      expect(result).toBeGreaterThan(0);
    });

    test('heroRevival - should apply server speed and return correct duration', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const { experience, speed } = database.selectObject({
        sql: `
          SELECT h.experience, s.speed
          FROM
            heroes h
              JOIN servers s ON 1 = 1
          WHERE
            h.player_id = $playerId;
        `,
        bind: { $playerId: PLAYER_ID },
        schema: z.strictObject({
          experience: z.number(),
          speed: z.number(),
        }),
      })!;

      const { level } = calculateHeroLevel(experience);
      const expectedDuration = calculateHeroRevivalTime(level) / speed;

      const result = getEventDuration(database, {
        type: 'heroRevival',
        villageId,
      } as GameEvent<'heroRevival'>);

      expect(result).toBe(expectedDuration);
    });

    test('heroRevival - should return zero duration if instant hero revival enabled', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      setDevFlag(database, 'is_instant_hero_revive_enabled', 1);

      const result = getEventDuration(database, {
        type: 'heroRevival',
        villageId,
      } as GameEvent<'heroRevival'>);

      expect(result).toBe(0);
    });
  });

  describe(getEventStartTime, () => {
    test('troopTraining - should return now if no previous events', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      vi.useFakeTimers();
      const now = 1_234_567_890;
      vi.setSystemTime(new Date(now));

      const event = createTroopTrainingEventMock({
        villageId,
      });

      expect(getEventStartTime(database, event)).toBe(now);
      vi.useRealTimers();
    });

    test('troopTraining - should return end of last event in queue', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const startsAt = 1_000;
      const duration = 500;
      insertEvents(database, [
        createTroopTrainingEventMock({
          id: 77_001,
          villageId,
          startsAt,
          duration,
        }),
      ]);

      const newEvent = createTroopTrainingEventMock({
        villageId,
        batchId: 'b2',
      });

      expect(getEventStartTime(database, newEvent)).toBe(1_500);
    });

    test('unitImprovement - should return last resolves_at or now', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const startsAt = 2_000;
      const duration = 500;
      insertEvents(database, [
        createUnitImprovementEventMock({
          id: 88_001,
          villageId,
          startsAt,
          duration,
        }),
      ]);

      const startTime = getEventStartTime(
        database,
        createUnitImprovementEventMock(),
      );

      expect(startTime).toBe(2_500);
    });

    test('scheduledBuildingEvent - should return resolvesAt from database', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const startsAt = 3_000;
      const duration = 400;
      insertEvents(database, [
        createBuildingLevelChangeEventMock({
          id: 66_001,
          villageId,
          startsAt,
          duration,
        }),
      ]);

      const startTime = getEventStartTime(
        database,
        createGameEventMock('buildingScheduledConstruction', {
          villageId,
          level: 2,
          previousLevel: 1,
        }),
      );

      expect(startTime).toBe(3_400);
    });

    test('adventurePointIncrease - should return startsAt + duration', async () => {
      const database = await prepareTestDatabase();
      const event = createGameEventMock('adventurePointIncrease', {
        startsAt: 1000,
        duration: 500,
      });
      expect(getEventStartTime(database, event)).toBe(1500);
    });

    test('returnTroopMovement - should return startsAt + duration', async () => {
      const database = await prepareTestDatabase();
      const event = createGameEventMock('troopMovementReturn', {
        startsAt: 2000,
        duration: 1000,
      });
      expect(getEventStartTime(database, event)).toBe(3000);
    });

    test('buildingConstruction - should return now', async () => {
      const database = await prepareTestDatabase();
      vi.useFakeTimers();
      const now = 9_999_999;
      vi.setSystemTime(new Date(now));
      const event = {
        type: 'buildingConstruction',
      } as GameEvent<'buildingConstruction'>;
      expect(getEventStartTime(database, event)).toBe(now);
      vi.useRealTimers();
    });
  });
});
