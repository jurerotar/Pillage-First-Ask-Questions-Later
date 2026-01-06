import type { Seeder } from '../types/seeder';

export const oasisTileResourceSeeder: Seeder = (database): void => {
  database.exec(
    `
      INSERT INTO
        oasis_tile_resource (tile_id, resource)
      SELECT
        s.tile_id,
        COALESCE(
          (
            SELECT o2.resource
            FROM oasis o2
            WHERE o2.id = s.min_nonwheat_id
            ),
          s.only_resource
        ) AS resource
      FROM
        (
          SELECT
            o.tile_id,
            MIN(CASE WHEN o.resource <> 'wheat' THEN o.id END) AS min_nonwheat_id,
            MIN(o.resource) AS only_resource
          FROM
            oasis o
          GROUP BY o.tile_id
          ) s;
    `,
  );
};
