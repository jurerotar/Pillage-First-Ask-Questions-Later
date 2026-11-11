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

  const questIds = database.selectValues({
    sql: "SELECT quest_id FROM quests WHERE quest_id GLOB 'celebrationCount-*' ORDER BY quest_id;",
    schema: z.string(),
  });

  expect(questIds.length).toBeGreaterThan(0);

  for (let count = 1; count <= 100; count += 1) {
    runEventCreationSideEffects(database, [
      createGameEventMock('culturePointsCelebration', {
        villageId,
        startsAt: count,
        celebrationType: count % 2 ? 'small' : 'large',
      }),
    ]);

    const completed = database.selectValue({
      sql: `
        SELECT json_group_array(json_array(quest_id, completed_at))
        FROM (SELECT quest_id, completed_at FROM quests WHERE quest_id GLOB 'celebrationCount-*' ORDER BY quest_id);
      `,
      schema: z.string(),
    });

    const expected = questIds.map((questId) => {
      const milestone = Number(questId.split('-')[1]);

      return [questId, milestone <= count ? milestone : null];
    });

    expect(completed).toBe(JSON.stringify(expected));
  }
});
