import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('metaSeeder', () => {
  test('meta table exists', () => {
    const exists = database.selectValue({
      sql: "SELECT COUNT(*) FROM sqlite_schema WHERE type='table' AND name='meta';",
      schema: z.number(),
    });
    expect(exists).toBe(1);
  });

  test('triggers exist for all tables', () => {
    const tables = database.selectValues({
      sql: "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%_ids' AND name NOT LIKE '%_history' AND name != 'meta';",
      schema: z.string(),
    });

    for (const table of tables) {
      const triggers = database.selectValues({
        sql: `SELECT name FROM sqlite_schema WHERE type='trigger' AND tbl_name = '${table}' AND name LIKE 'trg_update_meta_on_${table}_%';`,
        schema: z.string(),
      });

      expect(triggers).toContain(`trg_update_meta_on_${table}_insert`);
      expect(triggers).toContain(`trg_update_meta_on_${table}_update`);
      expect(triggers).toContain(`trg_update_meta_on_${table}_delete`);
    }
  });

  test('writing to a table updates meta.last_write', () => {
    const initialMeta = database.selectObject({
      sql: 'SELECT last_write FROM meta LIMIT 1;',
      schema: z.strictObject({ last_write: z.number() }),
    });

    database.exec({
      sql: 'UPDATE preferences SET is_accessibility_mode_enabled = 1 WHERE player_id = $player_id;',
      bind: { $player_id: PLAYER_ID },
    });

    const updatedMeta = database.selectObject({
      sql: 'SELECT last_write FROM meta LIMIT 1;',
      schema: z.strictObject({ last_write: z.number() }),
    });

    expect(updatedMeta).toBeDefined();
    if (initialMeta) {
      expect(updatedMeta?.last_write).not.toBe(initialMeta.last_write);
    } else {
      expect(updatedMeta?.last_write).toBeDefined();
    }
  });
});
