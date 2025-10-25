import type { Seeder } from 'app/interfaces/db';

export const oasisOccupiableBySeeder: Seeder = (database): void => {
  database.exec(`
    INSERT OR IGNORE INTO oasis_occupiable_by (tile_id, oasis_id)
    SELECT t.id AS tile_id, ot.id AS oasis_id
    FROM (
      SELECT ot.id, ot.x, ot.y
      FROM tiles ot
             JOIN oasis o ON o.tile_id = ot.id
      GROUP BY ot.id, ot.x, ot.y
      ) AS ot
           JOIN tiles t
                ON t.x BETWEEN ot.x - 3 AND ot.x + 3
                  AND t.y BETWEEN ot.y - 3 AND ot.y + 3
    ;
  `);
};
