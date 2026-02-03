import { z } from 'zod';
import { calculateGridLayout } from '@pillage-first/utils/map';
import type { Controller } from '../types/controller';
import {
  getTileOasisBonusesSchema,
  getTilesSchema,
  getTileTroopsSchema,
  getTileWorldItemSchema,
} from './schemas/map-schemas.ts';

/**
 * GET /tiles
 */
export const getTiles: Controller<'/tiles'> = (database) => {
  const parsedTiles = database.selectObjects({
    sql: `
    WITH
      wheat_id AS (
        SELECT id AS wid
        FROM effect_ids
        WHERE effect = 'wheatProduction'
        LIMIT 1
        ),

      effects_wheat AS (
        SELECT e.village_id, -e.value AS wheat_production_sum
        FROM effects e
               JOIN wheat_id w ON e.effect_id = w.wid
        WHERE e.scope = 'village'
          AND e.source_specifier = 0
        ),

      -- pick a deterministic single item per tile (smallest item_id)
      world_items_single AS (
        SELECT tile_id, item_id
        FROM (
          SELECT
            tile_id,
            item_id,
            ROW_NUMBER() OVER (PARTITION BY tile_id ORDER BY item_id) AS rn
          FROM world_items
          ) sub_wi
        WHERE rn = 1
        )

    SELECT
      t.id AS id,
      t.x AS coordinates_x,
      t.y AS coordinates_y,
      t.type AS type,
      rfc.resource_field_composition AS rfc,
      t.oasis_graphics AS oasis_graphics,
      v.id AS village_id,
      v.name AS village_name,
      v.slug AS village_slug,
      p.id AS player_id,
      p.slug AS player_slug,
      p.name AS player_name,
      p.tribe AS player_tribe,
      f.faction AS player_faction,

      CASE
        WHEN t.type = 'free' AND v.id IS NOT NULL THEN COALESCE(ew.wheat_production_sum, 0)
        END AS population,

      CASE
        WHEN t.type = 'free' THEN wi.item_id
        END AS item_id,

      -- boolean (0/1) indicating whether any oasis row exists for this tile
      CASE WHEN EXISTS (SELECT 1 FROM oasis o WHERE o.tile_id = t.id) THEN 1 ELSE 0 END AS oasis_is_occupiable

    FROM
      tiles t
        LEFT JOIN villages v ON v.tile_id = t.id
        LEFT JOIN players p ON p.id = v.player_id
        LEFT JOIN factions f ON f.id = p.faction_id
        LEFT JOIN resource_field_compositions rfc ON rfc.id = t.resource_field_composition_id
        LEFT JOIN effects_wheat ew ON ew.village_id = v.id
        LEFT JOIN world_items_single wi ON wi.tile_id = t.id

    ORDER BY
      t.id;
  `,
    schema: getTilesSchema,
  });

  const mapSize = database.selectValue({
    sql: 'SELECT map_size FROM servers LIMIT 1;',
    schema: z.number(),
  })!;

  const { totalTiles } = calculateGridLayout(mapSize);

  const tiles = Array.from({ length: totalTiles }).fill(null);

  for (const tile of parsedTiles) {
    tiles[tile.id - 1] = tile;
  }

  return tiles;
};

/**
 * GET /tiles/:tileId/troops
 * @pathParam {number} tileId
 */
export const getTileTroops: Controller<'/tiles/:tileId/troops'> = (
  database,
  { params },
) => {
  const { tileId } = params;

  return database.selectObjects({
    sql: `
    SELECT unit_id, amount, tile_id, source_tile_id
    FROM troops
    WHERE tile_id = $tile_id
    GROUP BY unit_id;
    `,
    bind: {
      $tile_id: tileId,
    },
    schema: getTileTroopsSchema,
  });
};

/**
 * GET /tiles/:tileId/bonuses
 * @pathParam {number} tileId
 */
export const getTileOasisBonuses: Controller<'/tiles/:tileId/bonuses'> = (
  database,
  { params },
) => {
  const { tileId } = params;

  return database.selectObjects({
    sql: `
      SELECT resource, bonus
      FROM oasis
      WHERE tile_id = $tile_id;
    `,
    bind: {
      $tile_id: tileId,
    },
    schema: getTileOasisBonusesSchema,
  });
};

/**
 * GET /tiles/:tileId/world-item
 * @pathParam {number} tileId
 */
export const getTileWorldItem: Controller<'/tiles/:tileId/world-item'> = (
  database,
  { params },
) => {
  const { tileId } = params;

  return (
    database.selectObject({
      sql: `
      SELECT item_id, amount
      FROM
        world_items
      WHERE
        tile_id = $tile_id
      LIMIT 1;
    `,
      bind: {
        $tile_id: tileId,
      },
      schema: getTileWorldItemSchema,
    }) ?? null
  );
};
