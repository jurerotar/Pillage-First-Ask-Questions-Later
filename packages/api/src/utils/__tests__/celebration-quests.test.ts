import { expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { createGameEventMock } from '@pillage-first/mocks/event';
import { runEventCreationSideEffects } from '../events';

test('celebrations complete global milestones on start and preserve completion timestamps', async () => {
  using database = await prepareTestDatabase();

  const villageId = database.selectValue({
    sql: 'SELECT id FROM villages WHERE player_id = $player_id LIMIT 1',
    bind: { $player_id: PLAYER_ID },
    schema: z.number(),
  })!;

  for (let count = 1; count <= 100; count += 1) {
    runEventCreationSideEffects(database, [
      createGameEventMock('culturePointsCelebration', {
        villageId,
        startsAt: count,
        celebrationType: count % 2 ? 'small' : 'large',
      }),
    ]);

    const completed = database.selectObjects({
      sql: "SELECT quest_id, completed_at FROM quests WHERE quest_id GLOB 'celebrationCount-*'",
      schema: z.object({
        quest_id: z.string(),
        completed_at: z.number().nullable(),
      }),
    });

    for (const quest of completed) {
      const milestone = Number(quest.quest_id.split('-')[1]);

      expect(quest.completed_at).toBe(milestone <= count ? milestone : null);
    }
  }
});
