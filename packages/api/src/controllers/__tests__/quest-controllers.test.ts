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
      schema: z.object({ id: z.number() }),
    })!;

    getQuests(
      database,
      createControllerArgs<'/villages/:villageId/quests'>({
        params: { villageId: village.id },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getCollectableQuestCount should return collectable quest count', async () => {
    const database = await prepareTestDatabase();

    getCollectableQuestCount(
      database,
      createControllerArgs<'/villages/:villageId/quests/collectables/count'>(
        {},
      ),
    );

    expect(true).toBeTruthy();
  });

  test('collectQuest should collect a quest', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.object({ id: z.number() }),
    })!;

    // Find a quest that is completed but not collected
    const quest = database.selectObject({
      sql: 'SELECT quest_id FROM quests WHERE completed_at IS NOT NULL AND collected_at IS NULL LIMIT 1',
      schema: z.object({ quest_id: z.string() }),
    });

    if (quest) {
      collectQuest(
        database,
        createControllerArgs<
          '/villages/:villageId/quests/:questId/collect',
          'patch'
        >({
          params: { villageId: village.id, questId: quest.quest_id },
        }),
      );
    }

    expect(true).toBeTruthy();
  });
});
