import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { prepareTestDatabase } from '../../';

describe('preferencesSeeder', () => {
  test('preferences row exists for player', async () => {
    using database = await prepareTestDatabase();

    const countRow = database.selectValue({
      sql: `
        SELECT COUNT(*) AS cnt
        FROM
          preferences
        WHERE
          player_id = $player_id;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    });

    expect(countRow).toBeGreaterThan(0);
  });
});
