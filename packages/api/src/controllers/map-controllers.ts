import { z } from 'zod';
import { calculateGridLayout } from '@pillage-first/utils/map';
import { createController } from '../utils/controller';
import {
  getTileOasisBonusesSchema,
  getTilesSchema,
  getTileTroopsSchema,
  getTileWorldItemSchema,
} from './schemas/map-schemas';

export const getTiles = createController('/tiles')(({ database }) => {
  const parsedTiles = database.selectObjects({
    sql: `
      WITH
        wheat_id AS (
          SELECT id AS wid
          FROM
            effect_ids
          WHERE
            effect = 'wheatProduction'
          LIMIT 1
          ),

        effects_wheat AS (
          SELECT e.village_id, SUM(-e.value) AS wheat_production_sum
          FROM
            effects e
              JOIN wheat_id w ON e.effect_id = w.wid
          WHERE
           e.type = 'base'
          AND e.scope = 'village'
          AND e.source = 'building'
            AND e.source_specifier = 0
          GROUP BY e.village_id
        ),

        -- pick a deterministic single item per tile (smallest item_id)
        world_items_single AS (
          SELECT tile_id, item_id
          FROM
            (
              SELECT
                tile_id,
                item_id,
                ROW_NUMBER() OVER (PARTITION BY tile_id ORDER BY item_id) AS rn
              FROM
                world_items
              ) sub_wi
          WHERE
            rn = 1
          )

      SELECT
        t.id AS id,
        t.x AS coordinates_x,
        t.y AS coordinates_y,
        t.type AS type,
        rfc.resource_field_composition AS rfc,
        t.oasis_graphics AS oasis_graphics,
        COALESCE(v.id, v_owner.id) AS village_id,
        COALESCE(v.name, v_owner.name) AS village_name,
        COALESCE(v.slug, v_owner.slug) AS village_slug,
        p.id AS player_id,
        p.slug AS player_slug,
        p.name AS player_name,
        ti.tribe AS player_tribe,
        fi.faction AS player_faction,

        CASE
          WHEN t.type = 'free' AND v.id IS NOT NULL THEN COALESCE(ew.wheat_production_sum, 0)
          WHEN t.type = 'oasis' AND v_owner.id IS NOT NULL THEN COALESCE(ew_owner.wheat_production_sum, 0)
          END AS population,

        CASE
          WHEN t.type = 'free' THEN wi.item_id
          END AS item_id,

        CASE
          WHEN t.type = 'oasis' THEN 1
          ELSE 0 END AS oasis_is_occupiable

      FROM
        tiles t
          LEFT JOIN villages v ON v.tile_id = t.id
          LEFT JOIN (
            SELECT tile_id, MAX(village_id) AS village_id
            FROM oasis
            GROUP BY tile_id
          ) o ON o.tile_id = t.id AND t.type = 'oasis'
          LEFT JOIN villages v_owner ON v_owner.id = o.village_id
          LEFT JOIN players p ON p.id = COALESCE(v.player_id, v_owner.player_id)
          LEFT JOIN tribe_ids ti ON p.tribe_id = ti.id
          LEFT JOIN faction_ids fi ON fi.id = p.faction_id
          LEFT JOIN resource_field_composition_ids rfc ON rfc.id = t.resource_field_composition_id
          LEFT JOIN effects_wheat ew ON ew.village_id = v.id
          LEFT JOIN effects_wheat ew_owner ON ew_owner.village_id = v_owner.id
          LEFT JOIN world_items_single wi ON wi.tile_id = t.id

      GROUP BY
        t.id

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

  const tiles = Array.from<z.infer<typeof getTilesSchema> | null>({
    length: totalTiles,
  }).fill(null);

  for (const tile of parsedTiles) {
    tiles[tile.id - 1] = tile;
  }

  return tiles;
});

export const getTileTroops = createController('/tiles/:tileId/troops')(
  ({ database, path: { tileId } }) => {
    return database.selectObjects({
      sql: `
        SELECT ui.unit AS unit_id, SUM(t.amount) AS amount, t.tile_id, t.source_tile_id
        FROM
          troops t
            JOIN unit_ids ui ON ui.id = t.unit_id
        WHERE
          t.tile_id = $tile_id
        GROUP BY
          ui.unit;
      `,
      bind: {
        $tile_id: tileId,
      },
      schema: getTileTroopsSchema,
    });
  },
);

export const getTileOasisBonuses = createController('/tiles/:tileId/bonuses')(
  ({ database, path: { tileId } }) => {
    return database.selectObjects({
      sql: `
        SELECT resource, bonus
        FROM
          oasis
        WHERE
          tile_id = $tile_id;
      `,
      bind: {
        $tile_id: tileId,
      },
      schema: getTileOasisBonusesSchema,
    });
  },
);

export const getTileWorldItem = createController('/tiles/:tileId/world-item')(
  ({ database, path: { tileId } }) => {
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
  },
);
