import { prngMulberry32 } from 'ts-seedrandom';
import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';
import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { seededRandomArrayElement } from '@pillage-first/utils/random';

type FreeTileRow = {
  id: number;
  x: number;
  y: number;
  resource_field_composition: ResourceFieldComposition;
};

type WheatOasisRow = {
  id: number;
  x: number;
  y: number;
};

// There should be at least some "good" croppers. This means 18c/15c with 150% bonus
export const guaranteedCroppersSeeder = (
  database: DbFacade,
  server: Server,
): void => {
  const prng = prngMulberry32(server.seed);

  const freeTileStatement = database.prepare({
    sql: `
      SELECT
        t.id,
        t.x,
        t.y,
        rfc.resource_field_composition
      FROM
        tiles t
          JOIN resource_field_composition_ids rfc ON rfc.id = t.resource_field_composition_id
      WHERE
        t.type = 'free'
      ORDER BY
        t.id;
    `,
  });

  const freeTiles: FreeTileRow[] = [];
  const freeTilesByCoordinates = new Map<`${number}-${number}`, FreeTileRow>();

  while (freeTileStatement.step()) {
    const tile = freeTileStatement.get({}) as FreeTileRow;
    freeTiles.push(tile);
    freeTilesByCoordinates.set(`${tile.x}-${tile.y}`, tile);
  }
  freeTileStatement.reset();

  const wheatOasisStatement = database.prepare({
    sql: `
      SELECT DISTINCT
        ot.id,
        ot.x,
        ot.y
      FROM
        oasis o
          JOIN tiles ot ON ot.id = o.tile_id
      WHERE
        o.resource = 'wheat'
        AND o.bonus = 50
      ORDER BY
        ot.id;
    `,
  });

  const nearbyWheatOasisCountByTileId = new Map<number, number>();

  while (wheatOasisStatement.step()) {
    const oasis = wheatOasisStatement.get({}) as WheatOasisRow;
    for (let x = oasis.x - 3; x <= oasis.x + 3; x += 1) {
      for (let y = oasis.y - 3; y <= oasis.y + 3; y += 1) {
        const tile = freeTilesByCoordinates.get(`${x}-${y}`);

        if (!tile) {
          continue;
        }

        nearbyWheatOasisCountByTileId.set(
          tile.id,
          (nearbyWheatOasisCountByTileId.get(tile.id) ?? 0) + 1,
        );
      }
    }
  }
  wheatOasisStatement.reset();

  const tileIdsEligibleForRFCChange = new Set<number>();

  const eighteenCropperTileIds = new Set<number>();
  const fifteenCropperTileIds = new Set<number>();
  const nineCropperTileIds = new Set<number>();

  for (const { id, resource_field_composition } of freeTiles) {
    if ((nearbyWheatOasisCountByTileId.get(id) ?? 0) < 3) {
      continue;
    }

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

    const values = [...ids].map((id) => `(${id}, '${rfc}')`).join(',\n      ');

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
