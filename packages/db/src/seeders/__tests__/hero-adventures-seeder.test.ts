import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('heroAdventuresSeeder', () => {
  test('hero has 3 available adventures and 0 completed', () => {
    const row = database.selectObject({
      sql: `
        SELECT
          available,
          completed,
          last_updated_at AS lastUpdatedAt,
          (SELECT created_at FROM servers LIMIT 1) AS serverCreatedAt
        FROM
          hero_adventures
        WHERE
          hero_id = (
            SELECT id
            FROM
              heroes
            WHERE
              player_id = $player_id
            )
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.strictObject({
        available: z.number(),
        completed: z.number(),
        lastUpdatedAt: z.number(),
        serverCreatedAt: z.number(),
      }),
    });

    expect(row).toBeDefined();
    expect(row?.available).toBe(3);
    expect(row?.completed).toBe(0);
    expect(row?.lastUpdatedAt).toBe(row?.serverCreatedAt);
  });
});
