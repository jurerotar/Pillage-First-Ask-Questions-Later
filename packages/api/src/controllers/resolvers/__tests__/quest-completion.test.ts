import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  createBuildingLevelChangeEventMock,
  createTroopTrainingEventMock,
} from '@pillage-first/mocks/event';
import type { Building } from '@pillage-first/types/models/building';
import type { Unit } from '@pillage-first/types/models/unit';
import { buildingLevelChangeResolver } from '../building-resolvers';
import { troopTrainingEventResolver } from '../troop-resolvers';

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
    const initialQuest = database.selectObject({
      sql: 'SELECT completed_at FROM quests WHERE quest_id = $quest_id AND village_id = $village_id',
      bind: { $quest_id: questId, $village_id: villageId },
      schema: z.strictObject({ completed_at: z.number().nullable() }),
    })!;
    expect(initialQuest.completed_at).toBe(null);

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
    const finalQuest = database.selectObject({
      sql: 'SELECT completed_at FROM quests WHERE quest_id = $quest_id AND village_id = $village_id',
      bind: { $quest_id: questId, $village_id: villageId },
      schema: z.strictObject({ completed_at: z.number().nullable() }),
    })!;
    expect(finalQuest.completed_at).not.toBe(null);
    expect(finalQuest.completed_at).toBe(1500);
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
    const initialQuest = database.selectObject({
      sql: 'SELECT completed_at FROM quests WHERE quest_id = $quest_id AND village_id = $village_id',
      bind: { $quest_id: questId, $village_id: villageId },
      schema: z.strictObject({ completed_at: z.number().nullable() }),
    })!;
    expect(initialQuest.completed_at).toBe(null);

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
    const finalQuest = database.selectObject({
      sql: 'SELECT completed_at FROM quests WHERE quest_id = $quest_id AND village_id = $village_id',
      bind: { $quest_id: questId, $village_id: villageId },
      schema: z.strictObject({ completed_at: z.number().nullable() }),
    })!;
    expect(finalQuest.completed_at).not.toBe(null);
    expect(finalQuest.completed_at).toBe(2500);
  });
});

describe('quest completion on troop training', () => {
  test('should complete unitTroopCount quest when enough of that unit type are trained', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const unitId: Unit['id'] = 'PHALANX';
    const questId = `unitTroopCount-${unitId}-10`;

    // 1. Verify the quest is seeded and not yet completed
    const initialQuest = database.selectObject({
      sql: 'SELECT completed_at FROM quests WHERE quest_id = $quest_id',
      bind: { $quest_id: questId },
      schema: z.strictObject({ completed_at: z.number().nullable() }),
    })!;
    expect(initialQuest).not.toBeNull();
    expect(initialQuest.completed_at).toBe(null);

    // The player starts with 3 PHALANX already seeded, so only 7 more are needed to reach 10.
    const mockEvent = createTroopTrainingEventMock({
      villageId,
      unitId,
    });

    // 2. Train 6 more troops (total 9) — quest should still be incomplete
    for (let i = 0; i < 6; i += 1) {
      troopTrainingEventResolver(database, {
        ...mockEvent,
        id: 100 + i,
        resolvesAt: 1000,
      });
    }

    const midQuest = database.selectObject({
      sql: 'SELECT completed_at FROM quests WHERE quest_id = $quest_id',
      bind: { $quest_id: questId },
      schema: z.strictObject({ completed_at: z.number().nullable() }),
    })!;
    expect(midQuest.completed_at).toBe(null);

    // 3. Train the 7th troop (total 10) — quest should now be complete
    troopTrainingEventResolver(database, {
      ...mockEvent,
      id: 200,
      resolvesAt: 2000,
    });

    const completedQuest = database.selectObject({
      sql: 'SELECT completed_at FROM quests WHERE quest_id = $quest_id',
      bind: { $quest_id: questId },
      schema: z.strictObject({ completed_at: z.number().nullable() }),
    })!;
    expect(completedQuest.completed_at).toBe(2000);
  });

  test('should not complete unitTroopCount quest for a different unit type', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const trainedUnitId: Unit['id'] = 'PHALANX';
    const otherUnitId: Unit['id'] = 'SWORDSMAN';
    const questId = `unitTroopCount-${otherUnitId}-10`;

    // 1. Verify the SWORDSMAN quest is seeded and not completed
    const initialQuest = database.selectObject({
      sql: 'SELECT completed_at FROM quests WHERE quest_id = $quest_id',
      bind: { $quest_id: questId },
      schema: z.strictObject({ completed_at: z.number().nullable() }),
    })!;
    expect(initialQuest).not.toBeNull();
    expect(initialQuest.completed_at).toBe(null);

    const mockEvent = createTroopTrainingEventMock({
      villageId,
      unitId: trainedUnitId,
    });

    // 2. Train 10 PHALANX — SWORDSMAN quest should remain incomplete
    for (let i = 0; i < 10; i += 1) {
      troopTrainingEventResolver(database, {
        ...mockEvent,
        id: 300 + i,
        resolvesAt: 1000,
      });
    }

    const finalQuest = database.selectObject({
      sql: 'SELECT completed_at FROM quests WHERE quest_id = $quest_id',
      bind: { $quest_id: questId },
      schema: z.strictObject({ completed_at: z.number().nullable() }),
    })!;
    expect(finalQuest.completed_at).toBe(null);
  });
});
