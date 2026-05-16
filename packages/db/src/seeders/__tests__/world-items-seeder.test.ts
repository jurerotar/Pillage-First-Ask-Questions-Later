import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('worldItemsSeeder', () => {
  test('world_items seeded only for NPC villages', () => {
    const invalid = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          world_items wi
            JOIN villages v ON wi.tile_id = v.tile_id
        WHERE
          v.player_id = $player_id;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    });
    expect(invalid).toBe(0);

    const count = database.selectValue({
      sql: 'SELECT COUNT(*) FROM world_items;',
      schema: z.number(),
    });
    expect(count).toBeGreaterThan(0);
  });
});
