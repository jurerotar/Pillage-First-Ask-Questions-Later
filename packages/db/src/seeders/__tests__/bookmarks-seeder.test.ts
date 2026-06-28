import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('bookmarksSeeder', () => {
  test('creates a default bookmark for every player-village building', () => {
    const row = database.selectObject({
      sql: `
        SELECT
          (SELECT COUNT(*) FROM bookmarks) AS bookmarkCount,
          (
            (SELECT COUNT(*) FROM villages WHERE player_id = $player_id)
            *
            (SELECT COUNT(*) FROM building_ids)
          ) AS expectedCount,
          (
            SELECT COUNT(*)
            FROM
              bookmarks b
                JOIN villages v ON v.id = b.village_id
            WHERE
              v.player_id != $player_id
          ) AS npcBookmarkCount,
          (
            SELECT COUNT(*)
            FROM
              bookmarks
            WHERE
              tab_name != 'default'
          ) AS nonDefaultTabCount;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.strictObject({
        bookmarkCount: z.number(),
        expectedCount: z.number(),
        npcBookmarkCount: z.number(),
        nonDefaultTabCount: z.number(),
      }),
    })!;

    expect(row.bookmarkCount).toBe(row.expectedCount);
    expect(row.npcBookmarkCount).toBe(0);
    expect(row.nonDefaultTabCount).toBe(0);
  });

  test('each player village has one bookmark for every building id', () => {
    const invalidVillageCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          villages v
        WHERE
          v.player_id = $player_id
          AND (
            SELECT COUNT(*)
            FROM
              bookmarks b
            WHERE
              b.village_id = v.id
          ) != (SELECT COUNT(*) FROM building_ids);
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    });

    expect(invalidVillageCount).toBe(0);
  });
});
