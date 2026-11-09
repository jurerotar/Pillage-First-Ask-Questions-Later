import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import {
  prepareTestDatabase,
  seedReportHistory,
} from '@pillage-first/api/testing';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getHunterLodgeCatchableAnimals } from '@pillage-first/game-assets/utils/hunters-lodge';
import {
  createBuildingLevelChangeEventMock,
  createHuntersLodgeHuntEventMock,
} from '@pillage-first/mocks/event';
import type { Building } from '@pillage-first/types/models/building';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  assessCaptureAnimalCountByIdQuestCompletion,
  assessCaptureAnimalKindCountQuestCompletion,
  assessGatheredResourceCountQuestCompletion,
} from '../../../../utils/quests';
import {
  insertGatheringExpeditionReport,
  insertReport,
} from '../../../../utils/report';
import { buildingLevelChangeResolver } from '../building-resolvers';
import { huntersLodgeHuntResolver } from '../hunters-lodge-resolvers';

const resolveHunt = (database: DbFacade, timestamp: number) =>
  huntersLodgeHuntResolver(
    database,
    createHuntersLodgeHuntEventMock({
      id: timestamp,
      villageId: 1,
      startsAt: timestamp - 1,
      duration: 1,
      resolvesAt: timestamp,
      huntingPartyLevel: 5,
    }),
  );

describe('quest completion on building level up', () => {
  test('should complete building quest when level increases to required level', async () => {
    using database = await prepareTestDatabase();
    const villageId = 1;
    const buildingFieldId = 1;
    const buildingId: Building['id'] = 'WOODCUTTER';
    const requiredLevel = 1;
    const questId = `oneOf-${buildingId}-${requiredLevel}`;

    // 1. Ensure the quest exists and is NOT completed
    database.exec({
      sql: `
        INSERT OR IGNORE INTO quests (player_id, quest_id, village_id, completed_at)
        VALUES (1, $quest_id, $village_id, NULL)
      `,
      bind: {
        $quest_id: questId,
        $village_id: villageId,
      },
    });

    // 2. Initial state: quest should not be completed
    const initialQuest = database.selectValue({
      sql: 'SELECT completed_at FROM quests WHERE quest_id = $quest_id AND village_id = $village_id',
      bind: { $quest_id: questId, $village_id: villageId },
      schema: z.number().nullable(),
    })!;

    expect(initialQuest).toBe(null);

    // 3. Trigger level change to level 1
    const mockEvent = createBuildingLevelChangeEventMock({
      id: 1,
      startsAt: 1000,
      duration: 500,
      villageId,
      buildingFieldId,
      buildingId,
      level: requiredLevel,
      previousLevel: 0,
    });

    buildingLevelChangeResolver(database, mockEvent);

    // 4. Check if quest is completed
    const finalQuest = database.selectValue({
      sql: 'SELECT completed_at FROM quests WHERE quest_id = $quest_id AND village_id = $village_id',
      bind: { $quest_id: questId, $village_id: villageId },
      schema: z.number().nullable(),
    })!;

    expect(finalQuest).not.toBe(null);
    expect(finalQuest).toBe(1500);
  });

  test('should complete "every" building quest when all buildings reach required level', async () => {
    using database = await prepareTestDatabase();
    const villageId = 1;
    const buildingId: Building['id'] = 'WOODCUTTER';
    const requiredLevel = 1;
    const questId = `every-${buildingId}-${requiredLevel}`;

    // 1. Set ALL woodcutters to level 1, except one to level 0
    database.exec({
      sql: `
        UPDATE building_fields
        SET level = 1
        WHERE village_id = $village_id
          AND building_id = (SELECT id FROM building_ids WHERE building = $building_id)
      `,
      bind: {
        $village_id: villageId,
        $building_id: buildingId,
      },
    });

    database.exec({
      sql: `
        UPDATE building_fields
        SET level = 0
        WHERE village_id = $village_id
          AND field_id = 2
          AND building_id = (SELECT id FROM building_ids WHERE building = $building_id)
      `,
      bind: {
        $village_id: villageId,
        $building_id: buildingId,
      },
    });

    // 2. Ensure the "every" quest exists and is NOT completed
    database.exec({
      sql: `
        INSERT OR IGNORE INTO quests (player_id, quest_id, village_id, completed_at)
        VALUES (1, $quest_id, $village_id, NULL)
      `,
      bind: {
        $quest_id: questId,
        $village_id: villageId,
      },
    });

    // 3. Initial state: quest should not be completed because field 2 is still level 0
    const initialQuest = database.selectValue({
      sql: 'SELECT completed_at FROM quests WHERE quest_id = $quest_id AND village_id = $village_id',
      bind: { $quest_id: questId, $village_id: villageId },
      schema: z.number().nullable(),
    })!;

    expect(initialQuest).toBe(null);

    // 4. Trigger level change for field 2 to level 1
    const mockEvent = createBuildingLevelChangeEventMock({
      id: 2,
      startsAt: 2000,
      duration: 500,
      villageId,
      buildingFieldId: 2,
      buildingId,
      level: 1,
      previousLevel: 0,
    });

    buildingLevelChangeResolver(database, mockEvent);

    // 5. Check if quest is completed
    const finalQuest = database.selectValue({
      sql: 'SELECT completed_at FROM quests WHERE quest_id = $quest_id AND village_id = $village_id',
      bind: { $quest_id: questId, $village_id: villageId },
      schema: z.number().nullable(),
    })!;

    expect(finalQuest).not.toBe(null);
    expect(finalQuest).toBe(2500);
  });

  test('should complete one-of-each animal quest when every catchable animal was captured', async () => {
    using database = await prepareTestDatabase();
    const timestamp = 3000;
    const animals = getHunterLodgeCatchableAnimals(5);
    using random = vi.spyOn(Math, 'random');

    for (const [index] of animals.entries()) {
      random.mockReturnValue((index + 0.5) / animals.length);
      resolveHunt(database, timestamp);
      database.exec({ sql: 'DELETE FROM reports;' });
    }

    assessCaptureAnimalKindCountQuestCompletion(database, timestamp, PLAYER_ID);

    const completedQuest = database.selectValue({
      sql: `
        SELECT completed_at
        FROM quests
        WHERE
          village_id IS NULL
          AND quest_id = $quest_id;
      `,
      bind: {
        $quest_id: `captureAnimalKindCount-${getHunterLodgeCatchableAnimals(5).length}`,
      },
      schema: z.number().nullable(),
    });

    expect(completedQuest).toBe(timestamp);
  });

  test.each(['deletion', 'retention'] as const)(
    'should count lifetime catches after report %s',
    async (removal) => {
      using database = await prepareTestDatabase();

      database.exec({ sql: 'DELETE FROM reports;' });

      const animals = getHunterLodgeCatchableAnimals(5);
      using _random = vi
        .spyOn(Math, 'random')
        .mockReturnValue((animals.indexOf('TIGER') + 0.5) / animals.length);

      // Seed the earlier catches, then exercise real hunts on both sides of the milestone.
      database.exec({
        sql: `
          INSERT INTO hunting_capture_history (player_id, unit_id, amount)
          SELECT $player_id, id, 48 FROM unit_ids WHERE unit = 'TIGER'
          ON CONFLICT (player_id, unit_id) DO UPDATE SET amount = 48;
        `,
        bind: { $player_id: PLAYER_ID },
      });

      resolveHunt(database, 1);

      const completion = () =>
        database.selectValue({
          sql: "SELECT completed_at FROM quests WHERE village_id IS NULL AND quest_id = 'captureAnimalCountById-TIGER-50';",
          schema: z.number().nullable(),
        });

      expect(completion()).toBeNull();

      if (removal === 'deletion') {
        database.exec({ sql: 'DELETE FROM reports;' });
      } else {
        seedReportHistory(database, {
          villageId: 1,
          count: 999,
          firstTimestamp: 2,
          timestampStep: 0,
        });

        expect(
          database.selectValue({
            sql: 'SELECT COUNT(*) FROM hunting_party_report_units;',
            schema: z.int(),
          }),
        ).toBe(1);

        // This real insertion crosses the unchanged 1,000-report limit and prunes the hunt.
        insertReport(database, {
          villageId: 1,
          timestamp: 2,
          type: 'adventure',
          outcome: 'heroAdventure',
          tags: [],
        });

        expect(
          database.selectValue({
            sql: 'SELECT COUNT(*) FROM reports;',
            schema: z.int(),
          }),
        ).toBe(1000);
      }

      expect(
        database.selectValue({
          sql: 'SELECT COUNT(*) FROM hunting_party_report_units;',
          schema: z.number(),
        }),
      ).toBe(0);

      resolveHunt(database, 3);

      expect(completion()).toBe(3);

      assessCaptureAnimalCountByIdQuestCompletion(
        database,
        'TIGER',
        4,
        PLAYER_ID,
      );

      expect(completion()).toBe(3);
    },
  );

  test('should complete gathered resource quest from total gathered loot', async () => {
    using database = await prepareTestDatabase();
    const villageId = 1;
    const timestamp = 4000;
    const village = database.selectObject({
      sql: `
        SELECT v.tile_id, p.tribe_id
        FROM villages v
        JOIN players p ON p.id = v.player_id
        WHERE v.id = $village_id;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        tile_id: tileIdSchema,
        tribe_id: z.number(),
      }),
    })!;

    insertGatheringExpeditionReport(database, {
      villageId,
      timestamp,
      villageTileId: village.tile_id,
      tribeId: village.tribe_id,
      loot: [25, 25, 25, 25],
      units: [
        {
          unitId: 'PHALANX',
          amount: 25,
        },
      ],
    });

    assessGatheredResourceCountQuestCompletion(database, timestamp, PLAYER_ID);

    const completedQuest = database.selectValue({
      sql: `
        SELECT completed_at
        FROM quests
        WHERE
          village_id IS NULL
          AND quest_id = 'gatheredResourceCount-100';
      `,
      schema: z.number().nullable(),
    });

    expect(completedQuest).toBe(timestamp);
  });
});
