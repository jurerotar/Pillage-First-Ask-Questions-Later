import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { getHunterLodgeCatchableAnimals } from '@pillage-first/game-assets/utils/hunters-lodge';
import { createBuildingLevelChangeEventMock } from '@pillage-first/mocks/event';
import type { Building } from '@pillage-first/types/models/building';
import {
  assessCaptureAnimalKindCountQuestCompletion,
  assessGatheredResourceCountQuestCompletion,
} from '../../../../utils/quests';
import {
  insertGatheringExpeditionReport,
  insertHuntingPartyReport,
} from '../../../../utils/report';
import { buildingLevelChangeResolver } from '../building-resolvers';

describe('quest completion on building level up', () => {
  test('should complete building quest when level increases to required level', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const buildingFieldId = 1;
    const buildingId: Building['id'] = 'WOODCUTTER';
    const requiredLevel = 1;
    const questId = `oneOf-${buildingId}-${requiredLevel}`;

    // 1. Ensure the quest exists and is NOT completed
    database.exec({
      sql: `
        INSERT OR IGNORE INTO quests (quest_id, village_id, completed_at)
        VALUES ($quest_id, $village_id, NULL)
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
    const database = await prepareTestDatabase();
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
        INSERT OR IGNORE INTO quests (quest_id, village_id, completed_at)
        VALUES ($quest_id, $village_id, NULL)
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
    const database = await prepareTestDatabase();
    const villageId = 1;
    const timestamp = 3000;
    const villageTileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id;',
      bind: { $village_id: villageId },
      schema: z.number(),
    })!;

    for (const unitId of getHunterLodgeCatchableAnimals(5)) {
      insertHuntingPartyReport(database, {
        villageId,
        timestamp,
        villageTileId,
        unitId,
        amount: 1,
      });
    }

    assessCaptureAnimalKindCountQuestCompletion(database, timestamp);

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

  test('should complete gathered resource quest from total gathered loot', async () => {
    const database = await prepareTestDatabase();
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
        tile_id: z.number(),
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

    assessGatheredResourceCountQuestCompletion(database, timestamp);

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
