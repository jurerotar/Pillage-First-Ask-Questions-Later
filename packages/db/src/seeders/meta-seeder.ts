import type { DbFacade } from '@pillage-first/utils/facades/database';

export const metaSeeder = (database: DbFacade): void => {
  database.exec({
    sql: 'INSERT INTO meta (last_write) VALUES (unixepoch());',
  });
};
