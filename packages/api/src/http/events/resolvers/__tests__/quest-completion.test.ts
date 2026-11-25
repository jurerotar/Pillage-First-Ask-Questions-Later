import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import {
  prepareTestDatabase,
  seedTestAdventureReports,
} from '@pillage-first/api/testing';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getHunterLodgeCatchableAnimals } from '@pillage-first/game-assets/utils/hunters-lodge';
import {
  createBuildingLevelChangeEventMock,
  createGatherersHutGatheringTripEventMock,
  createHuntersLodgeHuntEventMock,
} from '@pillage-first/mocks/event';
import type { Building } from '@pillage-first/types/models/building';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { selectGatheredResourceCountQuery } from '../../../../queries/quest-queries';
import { createEvents } from '../../../../utils/create-event';
import {
  assessBattleQuestCompletion,
  assessCaptureAnimalCountByIdQuestCompletion,
  assessCaptureAnimalKindCountQuestCompletion,
} from '../../../../utils/quests';
import { insertReport } from '../../../../utils/report';
import { buildingLevelChangeResolver } from '../building-level-change-resolver';
import { gatherersHutGatheringTripResolver } from '../gatherers-hut-gathering-trip-resolver';
import { huntersLodgeHuntResolver } from '../hunters-lodge-hunt-resolver';

test('completes overall and per-unit battle quests at their own casualty milestones', async () => {
  using database = await prepareTestDatabase();

  const otherPlayerId = database.selectValue({
    sql: 'SELECT id FROM players WHERE id <> $player_id LIMIT 1;',
    bind: { $player_id: PLAYER_ID },
    schema: z.int(),
  })!;

  database.exec({
    sql: "INSERT INTO quests (player_id, quest_id) VALUES ($player_id, 'killCount-10');",
    bind: { $player_id: otherPlayerId },
  });

  const getCompletion = (questId: string, playerId = PLAYER_ID) =>
    database.selectValue({
      sql: `
        SELECT completed_at FROM quests
        WHERE player_id = $player_id AND quest_id = $quest_id AND village_id IS NULL;
      `,
      bind: { $player_id: playerId, $quest_id: questId },
      schema: z.int().nullable(),
    });

  assessBattleQuestCompletion(database, 1, PLAYER_ID);

  expect(getCompletion('killCount-10')).toBeNull();

  database.exec({
    sql: `
      INSERT INTO enemy_casualty_totals (player_id, unit_id, amount)
      SELECT $player_id, id, CASE unit WHEN 'PHALANX' THEN 6 ELSE 4 END
      FROM unit_ids WHERE unit IN ('PHALANX', 'LEGIONNAIRE');
    `,
    bind: { $player_id: PLAYER_ID },
  });

  assessBattleQuestCompletion(database, 2, PLAYER_ID);

  expect(getCompletion('killCount-10')).toBe(2);
  expect(getCompletion('unitKillCount-PHALANX-10')).toBeNull();

  database.exec({
    sql: `
      UPDATE enemy_casualty_totals SET amount = 10
      WHERE player_id = $player_id AND unit_id = (SELECT id FROM unit_ids WHERE unit = 'PHALANX');
    `,
    bind: { $player_id: PLAYER_ID },
  });

  assessBattleQuestCompletion(database, 3, PLAYER_ID);
  assessBattleQuestCompletion(database, 4, PLAYER_ID);

  expect(getCompletion('killCount-10')).toBe(2);
  expect(getCompletion('unitKillCount-PHALANX-10')).toBe(3);
  expect(getCompletion('unitKillCount-LEGIONNAIRE-10')).toBeNull();
  expect(getCompletion('killCount-50')).toBeNull();
  expect(getCompletion('killCount-10', otherPlayerId)).toBeNull();
});

const resolveHunt = (database: DbFacade, timestamp: number) =>
  huntersLodgeHuntResolver.resolve(
    database,
    createHuntersLodgeHuntEventMock({
      id: timestamp,
      villageId: 1,
      startsAt: timestamp - 1,
      duration: 1,
      resolvesAt: timestamp,
      huntingPartyLevel: 5,
    }),
    createEvents,
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

    buildingLevelChangeResolver.resolve(database, mockEvent, createEvents);

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

    buildingLevelChangeResolver.resolve(database, mockEvent, createEvents);

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

  test('should count lifetime catches after report deletion', async () => {
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

    database.exec({ sql: 'DELETE FROM reports;' });

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
  });

  test('should count lifetime catches after report retention', async () => {
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

    seedTestAdventureReports(database, 1, 999, 2, 0);

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
  });

  test.each(['deletion', 'retention'])(
    'should keep gathering progress after report %s',
    async (removal) => {
      using database = await prepareTestDatabase();

      const villageId = 1;

      const tileId = database.selectValue({
        sql: 'SELECT tile_id FROM villages WHERE id = $village_id;',
        bind: { $village_id: villageId },
        schema: tileIdSchema,
      })!;

      const resolveExpedition = (resolvesAt: number, amount: number) =>
        gatherersHutGatheringTripResolver.resolve(
          database,
          createGatherersHutGatheringTripEventMock({
            villageId,
            resolvesAt,
            troops: [
              { unitId: 'PHALANX', amount, tileId, sourceTileId: tileId },
            ],
          }),
          createEvents,
        );

      const getProgress = () =>
        database.selectValue({
          sql: selectGatheredResourceCountQuery,
          bind: { $player_id: PLAYER_ID },
          schema: z.number(),
        });

      const getCompletion = () =>
        database.selectValue({
          sql: "SELECT completed_at FROM quests WHERE quest_id = 'gatheredResourceCount-100';",
          schema: z.number().nullable(),
        });

      const getReportCount = () =>
        database.selectValue({
          sql: 'SELECT COUNT(*) FROM gathering_expedition_reports;',
          schema: z.number(),
        });

      resolveExpedition(1, 24);

      expect(getReportCount()).toBe(1);
      expect(getProgress()).toBe(96);
      expect(getCompletion()).toBeNull();

      if (removal === 'deletion') {
        database.exec({ sql: 'DELETE FROM reports;' });
      } else {
        seedTestAdventureReports(database, villageId, 999, 2, 0);

        insertReport(database, {
          villageId,
          timestamp: 3,
          type: 'adventure',
          outcome: 'heroAdventure',
          tags: [],
        });
      }

      expect(getReportCount()).toBe(0);
      expect(getProgress()).toBe(96);

      database.exec({
        sql: "INSERT INTO report_generation_settings (player_id, filter) VALUES ($player_id, 'gatheringExpedition');",
        bind: { $player_id: PLAYER_ID },
      });

      resolveExpedition(4, 1);

      expect(getReportCount()).toBe(0);
      expect(getProgress()).toBe(100);
      expect(getCompletion()).toBe(4);
    },
  );
});
