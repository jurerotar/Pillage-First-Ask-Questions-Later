import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('preferencesSeeder', () => {
  test('preferences row exists for player', () => {
    const countRow = database.selectObject({
      sql: `
        SELECT COUNT(*) AS cnt
        FROM
          preferences
        WHERE
          player_id = $player_id;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.strictObject({ cnt: z.number() }),
    });

    expect(countRow?.cnt).toBeGreaterThan(0);
  });
});
