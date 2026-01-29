import type { Seeder } from '../types/seeder';

export const oasisOccupiableBySeeder: Seeder = (database) => {
  // Create oasis_occupiable_by entries for 50% wheat oasis only. We'll create the rest of the entries later
  database.exec({
    sql: `
      WITH RECURSIVE
        offsets(d) AS (
          SELECT -3 UNION ALL SELECT d + 1 FROM offsets WHERE d < 3
        )
      INSERT OR IGNORE INTO
        oasis_occupiable_by (occupiable_tile_id, occupiable_oasis_tile_id)
      SELECT t.id, o.tile_id
      FROM
        oasis o
          JOIN tiles ot ON ot.id = o.tile_id
          CROSS JOIN offsets dx
          CROSS JOIN offsets dy
          JOIN tiles t
               ON t.type = 'free'
                 AND t.x = ot.x + dx.d
                 AND t.y = ot.y + dy.d
      WHERE
        o.resource = 'wheat'
        AND o.bonus = 50
      ;
    `,
  });
};
