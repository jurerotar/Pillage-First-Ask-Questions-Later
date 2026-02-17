import { prngMulberry32 } from 'ts-seedrandom';
import { z } from 'zod';
import {
  type ResourceFieldComposition,
  resourceFieldCompositionSchema,
} from '@pillage-first/types/models/resource-field-composition';
import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { seededRandomArrayElement } from '@pillage-first/utils/random';

// There should be at least some "good" croppers. This means 18c/15c with 150% bonus
export const guaranteedCroppersSeeder = (
  database: DbFacade,
  server: Server,
): void => {
  const prng = prngMulberry32(server.seed);

  const tilesWith3Unique50PercentWheatBonuses = database.selectObjects({
    sql: `
      SELECT
        t.id,
        rfc.resource_field_composition
      FROM
        tiles t
          LEFT JOIN resource_field_composition_ids rfc
                    ON rfc.id = t.resource_field_composition_id
          JOIN oasis_occupiable_by ob
               ON ob.occupiable_tile_id = t.id
      WHERE
        t.type = 'free'
      GROUP BY
        t.id, rfc.resource_field_composition
      HAVING
        COUNT(DISTINCT ob.occupiable_oasis_tile_id) >= 3;
    `,
    schema: z.strictObject({
      id: z.number(),
      resource_field_composition: resourceFieldCompositionSchema,
    }),
  });

  const tileIdsEligibleForRFCChange = new Set<number>();

  const eighteenCropperTileIds = new Set<number>();
  const fifteenCropperTileIds = new Set<number>();
  const nineCropperTileIds = new Set<number>();

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
    const id = seededRandomArrayElement(prng, [...tileIdsEligibleForRFCChange]);
    eighteenCropperTileIds.add(id);
    tileIdsEligibleForRFCChange.delete(id);
  }

  while (
    fifteenCropperTileIds.size < 12 &&
    tileIdsEligibleForRFCChange.size > 0
  ) {
    const id = seededRandomArrayElement(prng, [...tileIdsEligibleForRFCChange]);
    fifteenCropperTileIds.add(id);
    tileIdsEligibleForRFCChange.delete(id);
  }

  while (nineCropperTileIds.size < 20 && tileIdsEligibleForRFCChange.size > 0) {
    const id = seededRandomArrayElement(prng, [...tileIdsEligibleForRFCChange]);
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
          VALUES ${values}
          )
      UPDATE tiles
      SET
        resource_field_composition_id = (
          SELECT r.id
          FROM
            resource_field_composition_ids r
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
