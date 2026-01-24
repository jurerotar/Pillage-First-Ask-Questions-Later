import type { Seeder } from '../types/seeder';

export const oasisOccupiableBySeeder: Seeder = (database) => {
  // Create oasis_occupiable_by entries for 50% wheat oasis only. We'll create the rest of the entries later
  database.exec({
    sql: `
      INSERT OR IGNORE INTO
        oasis_occupiable_by (occupiable_tile_id, occupiable_oasis_tile_id)
      SELECT t.id, o.tile_id
      FROM
        oasis o
          JOIN tiles ot ON ot.id = o.tile_id
          JOIN tiles t
               ON t.x BETWEEN ot.x - 3 AND ot.x + 3
                 AND t.y BETWEEN ot.y - 3 AND ot.y + 3
      WHERE
        o.resource = 'wheat'
        AND o.bonus = 50
        AND t.type = 'free'
      ;
    `,
  });
};
