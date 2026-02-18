import type { DbFacade } from '@pillage-first/utils/facades/database';

export const factionsSeeder = (database: DbFacade): void => {
  database.exec({
    sql: `
      INSERT INTO
        factions (faction_id)
      SELECT
        id
      FROM
        faction_ids;
    `,
  });
};
