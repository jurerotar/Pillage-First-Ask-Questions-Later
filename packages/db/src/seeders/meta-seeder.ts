import type { DbFacade } from '@pillage-first/utils/facades/database';

export const metaSeeder = (database: DbFacade): void => {
  database.exec({
    sql: `
      INSERT INTO
        meta (last_write, total_time_skipped, vacation_started_at)
      VALUES
        (CAST(unixepoch('subsec') * 1000 AS INTEGER), 0, NULL);
    `,
  });
};
