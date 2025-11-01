import type { Seeder } from 'app/interfaces/db';
import type { ResourceFieldComposition } from 'app/interfaces/models/game/resource-field-composition';
import { seededRandomArrayElement } from 'app/utils/common';
import { prngMulberry32 } from 'ts-seedrandom';

type TilesWith3Unique50PercentWheatBonuses = {
  id: number;
  resource_field_composition: ResourceFieldComposition;
};

// There should be at least some "good" croppers. This means 18c/15c with 150% bonus
export const guaranteedCroppersSeeder: Seeder = (database, server) => {
  const prng = prngMulberry32(server.seed);

  // Create oasis_occupiable_by entries for 50% wheat oasis only. We'll create the rest of the entries later
  database.exec(
    `
      INSERT OR IGNORE INTO
        oasis_occupiable_by (tile_id, oasis_id)
      SELECT t.id AS tile_id, ot.id AS oasis_id
      FROM
        (
          SELECT ot.id, ot.x, ot.y
          FROM
            tiles ot
              JOIN oasis o ON o.tile_id = ot.id
          WHERE
            o.resource = 'wheat'
            AND o.bonus = 50
          GROUP BY ot.id, ot.x, ot.y
          ) AS ot
          JOIN tiles t
               ON t.x BETWEEN ot.x - 3 AND ot.x + 3
                 AND t.y BETWEEN ot.y - 3 AND ot.y + 3
      ;
    `,
  );

  const tilesWith3Unique50PercentWheatBonuses = database.selectObjects(
    `
      SELECT
        t.id,
        rfc.resource_field_composition
      FROM
        tiles t
          LEFT JOIN resource_field_compositions rfc
                    ON rfc.id = t.resource_field_composition_id
          JOIN oasis_occupiable_by ob
               ON ob.tile_id = t.id
          JOIN oasis o
               ON o.tile_id = ob.oasis_id
      WHERE
        o.bonus = 50
        AND t.type = 'free'
      GROUP BY
        t.id, rfc.resource_field_composition
      HAVING
        COUNT(DISTINCT o.tile_id) >= 3;
    `,
  ) as TilesWith3Unique50PercentWheatBonuses[];

  const tileIdsEligibleForRFCChange = new Set<number>([]);

  const eighteenCropperTileIds = new Set<number>([]);
  const fifteenCropperTileIds = new Set<number>([]);
  const nineCropperTileIds = new Set<number>([]);

  for (const {
    id,
    resource_field_composition,
  } of tilesWith3Unique50PercentWheatBonuses) {
    if (resource_field_composition === '00018') {
      eighteenCropperTileIds.add(id);
      continue;
    }

    if (resource_field_composition === '11115') {
      fifteenCropperTileIds.add(id);
      continue;
    }

    if (resource_field_composition === '3339') {
      nineCropperTileIds.add(id);
      continue;
    }

    tileIdsEligibleForRFCChange.add(id);
  }

  while (
    eighteenCropperTileIds.size < 4 &&
    tileIdsEligibleForRFCChange.size > 0
  ) {
    const id = seededRandomArrayElement(
      prng,
      Array.from(tileIdsEligibleForRFCChange),
    );
    eighteenCropperTileIds.add(id);
    tileIdsEligibleForRFCChange.delete(id);
  }

  while (
    fifteenCropperTileIds.size < 12 &&
    tileIdsEligibleForRFCChange.size > 0
  ) {
    const id = seededRandomArrayElement(
      prng,
      Array.from(tileIdsEligibleForRFCChange),
    );
    fifteenCropperTileIds.add(id);
    tileIdsEligibleForRFCChange.delete(id);
  }

  while (nineCropperTileIds.size < 20 && tileIdsEligibleForRFCChange.size > 0) {
    const id = seededRandomArrayElement(
      prng,
      Array.from(tileIdsEligibleForRFCChange),
    );
    nineCropperTileIds.add(id);
    tileIdsEligibleForRFCChange.delete(id);
  }

  const runRfcUpdate = (ids: Set<number>, rfc: ResourceFieldComposition) => {
    if (ids.size === 0) {
      return;
    }

    const values = Array.from(ids)
      .map((id) => `(${id}, '${rfc}')`)
      .join(',\n      ');

    const sql = `
      WITH
        updates(tile_id, rfc) AS (
          VALUES
            ${values}
          )
      UPDATE tiles
      SET
        resource_field_composition_id = (
          SELECT r.id
          FROM
            resource_field_compositions r
          WHERE
            r.resource_field_composition = (
              SELECT u.rfc
              FROM
                updates u
              WHERE
                u.tile_id = tiles.id
              )
          )
      WHERE
        id IN (
          SELECT tile_id
          FROM
            updates
          );
    `;

    database.exec({ sql });
  };

  runRfcUpdate(eighteenCropperTileIds, '00018');
  runRfcUpdate(fifteenCropperTileIds, '11115');
  runRfcUpdate(nineCropperTileIds, '3339');
};
