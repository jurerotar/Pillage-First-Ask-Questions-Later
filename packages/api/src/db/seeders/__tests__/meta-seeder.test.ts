import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { prepareTestDatabase } from '../../testing';

describe('metaSeeder', () => {
  test('writing to a table updates meta.last_write', async () => {
    using database = await prepareTestDatabase();

    database.exec({
      sql: 'UPDATE meta SET last_write = 0;',
    });

    database.exec({
      sql: 'UPDATE preferences SET is_accessibility_mode_enabled = 1 WHERE player_id = $player_id;',
      bind: { $player_id: PLAYER_ID },
    });

    const updatedMeta = database.selectValue({
      sql: 'SELECT last_write FROM meta LIMIT 1;',
      schema: z.number(),
    });

    expect(updatedMeta).toBeDefined();
    expect(updatedMeta).toBeGreaterThan(0);
  });
});
