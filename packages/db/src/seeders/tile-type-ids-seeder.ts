import type { DbFacade } from '@pillage-first/utils/facades/database';

export const tileTypeIdsSeeder = (database: DbFacade): void => {
  database.exec({
    sql: `
      INSERT INTO tile_type_ids (id, type)
      VALUES
        (1, 'free'),
        (2, 'oasis');
    `,
  });
};
