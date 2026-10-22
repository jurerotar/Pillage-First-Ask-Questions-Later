import type { DbFacade } from '@pillage-first/utils/facades/database';

export const effectAttributeIdsSeeder = (database: DbFacade): void => {
  database.exec({
    sql: `
      INSERT INTO effect_type_ids (id, type)
      VALUES
        (1, 'base'),
        (2, 'bonus'),
        (3, 'bonus-booster');
    `,
  });

  database.exec({
    sql: `
      INSERT INTO effect_scope_ids (id, scope)
      VALUES
        (1, 'global'),
        (2, 'local'),
        (3, 'server');
    `,
  });

  database.exec({
    sql: `
      INSERT INTO effect_source_ids (id, source)
      VALUES
        (1, 'building'),
        (2, 'hero'),
        (3, 'oasis'),
        (4, 'artifact'),
        (5, 'tribe'),
        (6, 'server'),
        (7, 'troops');
    `,
  });
};
