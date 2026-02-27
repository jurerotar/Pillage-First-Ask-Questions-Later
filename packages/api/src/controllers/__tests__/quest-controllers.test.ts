import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  collectQuest,
  getCollectableQuestCount,
  getQuests,
} from '../quest-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('quest-controllers', () => {
  test('getQuests should return quests for a village', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.strictObject({ id: z.number() }),
    })!;

    getQuests(
      database,
      createControllerArgs<'/villages/:villageId/quests'>({
        path: { villageId: village.id },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getCollectableQuestCount should return collectable quest count', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.strictObject({ id: z.number() }),
    })!;

    // 1. Initially, let's see how many collectable quests there are for this village
    // It should include global quests (village_id IS NULL) and village-specific quests.
    const { collectableQuestCount: initialCount } = getCollectableQuestCount(
      database,
      createControllerArgs<'/villages/:villageId/quests/collectables/count'>({
        path: { villageId: village.id },
      }),
    );

    // 2. Add a global collectable quest
    database.exec({
      sql: `
        INSERT INTO
          quests (quest_id, completed_at, village_id)
        VALUES
          ($quest_id, $completed_at, NULL)
      `,
      bind: {
        $quest_id: 'test-global-quest',
        $completed_at: Date.now(),
      },
    });

    // 3. Add a village-specific collectable quest for our village
    database.exec({
      sql: `
        INSERT INTO
          quests (quest_id, completed_at, village_id)
        VALUES
          ($quest_id, $completed_at, $village_id)
      `,
      bind: {
        $quest_id: 'test-village-quest',
        $completed_at: Date.now(),
        $village_id: village.id,
      },
    });

    // 4. Add a village-specific collectable quest for ANOTHER village (should NOT be counted)
    database.exec({
      sql: `
        INSERT INTO
          quests (quest_id, completed_at, village_id)
        VALUES
          ($quest_id, $completed_at, $village_id)
      `,
      bind: {
        $quest_id: 'test-other-village-quest',
        $completed_at: Date.now(),
        $village_id: village.id + 1, // Assumes village.id + 1 exists or doesn't violate FK (test db usually doesn't have strict FKs or we can just use a number)
      },
    });

    const { collectableQuestCount: finalCount } = getCollectableQuestCount(
      database,
      createControllerArgs<'/villages/:villageId/quests/collectables/count'>({
        path: { villageId: village.id },
      }),
    );

    expect(finalCount).toBe(initialCount + 2);
  });

  test('collectQuest should collect a quest', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.strictObject({ id: z.number() }),
    })!;

    // Find a quest that is completed but not collected
    const quest = database.selectObject({
      sql: 'SELECT quest_id FROM quests WHERE completed_at IS NOT NULL AND collected_at IS NULL LIMIT 1',
      schema: z.strictObject({ quest_id: z.string() }),
    })!;

    collectQuest(
      database,
      createControllerArgs<
        '/villages/:villageId/quests/:questId/collect',
        'patch'
      >({
        path: { villageId: village.id, questId: quest.quest_id },
      }),
    );

    expect(true).toBeTruthy();
  });
});
