import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const setupGlobalWriteTriggers = (db: DbFacade): void => {
  // 1. Fetch all user-defined tables, excluding internal ones, history tables, and those ending in '_ids'
  const tables = db.selectValues({
    sql: "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%_ids' AND name NOT LIKE '%_history' AND name != 'meta';",
    schema: z.string(),
  });

  for (const table of tables) {
    const triggerPrefix = `trg_update_meta_on_${table}`;

    // We update the 'meta' table with the current Unix timestamp on every write
    const triggerLogic = `
      BEGIN
        UPDATE meta SET last_write = unixepoch();
      END;
    `;

    // 2. Create triggers for INSERT, UPDATE, and DELETE
    const events = ['INSERT', 'UPDATE', 'DELETE'];

    for (const event of events) {
      const sql = `
        CREATE TRIGGER IF NOT EXISTS ${triggerPrefix}_${event.toLowerCase()}
        AFTER ${event} ON ${table}
        ${triggerLogic}
      `;
      db.exec({ sql });
    }
  }
};
