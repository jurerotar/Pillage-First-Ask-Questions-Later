import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { playerSchema } from '@pillage-first/types/models/player';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import {
  baseTileSchema,
  tileTypeSchema,
} from '@pillage-first/types/models/tile';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import { calculateGridLayout } from '@pillage-first/utils/map';
import type { Controller } from '../types/handler';

const getFreeTileSchema = baseTileSchema.extend({
  type: z.literal('free'),
  tile: z.strictObject({
    resourceFieldComposition: resourceFieldCompositionSchema,
  }),
  owner: playerSchema
    .extend({
      reputation: z.number().nullable(),
    })
    .nullable(),
  owner_village: z
    .strictObject({
      id: z.number(),
      name: z.string(),
      population: z.number().nullable(),
    })
    .nullable(),
});

const getOasisTileSchema = baseTileSchema.extend({
  type: z.literal('oasis'),
  tile: z.strictObject({
    oasis_graphics: z.number(),
    oasis_resource: resourceSchema.nullable(),
  }),
  owner: playerSchema
    .extend({
      reputation: z.number().nullable(),
    })
    .nullable(),
  owner_village: z
    .strictObject({
      id: z.number(),
      name: z.string(),
      population: z.number().nullable(),
    })
    .nullable(),
  troops: z.array(
    z.strictObject({
      unit_id: unitIdSchema,
      amount: z.number(),
    }),
  ),
  bonuses: z.array(
    z.strictObject({
      resource: resourceSchema,
      bonus: z.number(),
    }),
  ),
});

const _getTileSchema = z.discriminatedUnion('type', [
  getFreeTileSchema,
  getOasisTileSchema,
]);

// .transform((t) => ({
//   id: t.id,
//   coordinates: {
//     x: t.coordinates_x,
//     y: t.coordinates_y,
//   },
//   type: t.type,
//   ...(t.type === 'free' && {
//     resourceFieldComposition: t.rfc,
//     isOccupied: !!t.village_id,
//     tribe: t.player_tribe,
//     population: t.population,
//     reputation: t.reputation,
//     itemType: t.item_type,
//   }),
//   ...(t.type === 'oasis' && {
//     oasisGraphics: t.oasis_graphics,
//     oasisResource: t.oasis_resource,
//     isOccupied: !!t.oasis_occupied,
//   }),
// }));

/**
 * GET /tiles/:tileId
 * @pathParam {number} tileId
 */
export const getTile: Controller<'/tiles/:tileId'> = (
  _database,
  { params },
) => {
  const { tileId: _tileId } = params;

  // const b = performance.now();
  //
  // const row = database.selectObject(
  //   `
  //     WITH
  //       -- effect id for wheat production
  //       wheat_id AS (
  //         SELECT id AS wid
  //         FROM
  //           effect_ids
  //         WHERE
  //           effect = 'wheatProduction'
  //         LIMIT 1
  //         ),
  //
  //       -- use provided player id to derive source faction
  //       src_faction AS (
  //         SELECT faction_id AS fid
  //         FROM
  //           players
  //         WHERE
  //           id = $player_id
  //         LIMIT 1
  //         ),
  //
  //       -- reputation for that source faction toward targets
  //       reputation_by_target AS (
  //         SELECT fr.target_faction_id, fr.reputation
  //         FROM
  //           faction_reputation fr
  //             JOIN src_faction s ON fr.source_faction_id = s.fid
  //         ),
  //
  //       -- wheat production per village (if present)
  //       effects_wheat AS (
  //         SELECT e.village_id, e.value AS wheat_production_sum
  //         FROM
  //           effects e
  //             JOIN wheat_id w ON e.effect_id = w.wid
  //         WHERE
  //           e.scope = 'village'
  //           AND e.source_specifier = 0
  //         ),
  //
  //       -- preferred non-wheat oasis per tile (seeded order = min(id))
  //       oasis_nonwheat_min AS (
  //         SELECT tile_id, MIN(id) AS min_nonwheat_id
  //         FROM
  //           oasis
  //         WHERE
  //           resource <> 'wheat'
  //         GROUP BY tile_id
  //         ),
  //       oasis_pref AS (
  //         SELECT o.tile_id, o.resource AS preferred_non_wheat
  //         FROM
  //           oasis o
  //             JOIN oasis_nonwheat_min m ON m.tile_id = o.tile_id AND m.min_nonwheat_id = o.id
  //         ),
  //
  //       -- aggregated oasis metrics (counts, occupied_count, fallback resource)
  //       oasis_agg AS (
  //         SELECT
  //           o.tile_id,
  //           COUNT(*) AS cnt,
  //           SUM(CASE WHEN o.village_id IS NOT NULL THEN 1 ELSE 0 END) AS occupied_count,
  //           MIN(o.resource) AS only_resource
  //         FROM
  //           oasis o
  //         GROUP BY o.tile_id
  //         ),
  //
  //       -- troops present on each tile (from your \`troops\` table)
  //       troops_agg AS (
  //         SELECT
  //           tr.tile_id,
  //           JSON_GROUP_ARRAY(
  //             JSON_OBJECT(
  //               'unit_id', tr.unit_id,
  //               'amount', tr.amount
  //             )
  //           ) AS troops_json
  //         FROM
  //           troops tr
  //         GROUP BY tr.tile_id
  //         ),
  //
  //       -- bonuses per tile from oasis rows (resource + bonus)
  //       bonuses_agg AS (
  //         SELECT
  //           o.tile_id,
  //           JSON_GROUP_ARRAY(
  //             JSON_OBJECT(
  //               'resource', o.resource,
  //               'bonus', o.bonus
  //             )
  //           ) AS bonuses_json
  //         FROM
  //           oasis o
  //         GROUP BY o.tile_id
  //         )
  //
  //     SELECT
  //       t.id AS id,
  //
  //       -- coordinates object { x, y }
  //       JSON_OBJECT('x', t.x, 'y', t.y) AS coordinates,
  //       t.type AS type,
  //
  //       -- tile object differs by type
  //       CASE
  //         WHEN t.type = 'free' THEN
  //           JSON_OBJECT(
  //             'resourceFieldComposition',
  //             rfc.resource_field_composition
  //           )
  //         WHEN t.type = 'oasis' THEN
  //           JSON_OBJECT(
  //             'oasis_graphics', t.oasis_graphics,
  //             'oasis_resource',
  //             CASE
  //               WHEN oa.cnt IS NULL OR oa.cnt = 0 THEN NULL
  //               WHEN oa.cnt = 1 THEN oa.only_resource
  //               ELSE COALESCE(op.preferred_non_wheat, oa.only_resource)
  //               END
  //           )
  //         ELSE NULL
  //         END AS tile,
  //
  //       -- owner (player) with reputation from $player_id's faction perspective
  //       CASE
  //         WHEN v.id IS NOT NULL THEN
  //           JSON_OBJECT(
  //             'id', p.id,
  //             'name', COALESCE(p.name, p.slug),
  //             'tribe', p.tribe,
  //             'reputation', rb.reputation
  //           )
  //         ELSE NULL
  //         END AS owner,
  //
  //       -- owner_village if tile has village
  //       CASE
  //         WHEN v.id IS NOT NULL THEN
  //           JSON_OBJECT(
  //             'id', v.id,
  //             'name', v.name,
  //             'population', COALESCE(ew.wheat_production_sum, NULL)
  //           )
  //         ELSE NULL
  //         END AS owner_village,
  //
  //       -- troops and bonuses arrays for this tile (JSON arrays)
  //       COALESCE(ta.troops_json, '[]') AS troops,
  //       COALESCE(ba.bonuses_json, '[]') AS bonuses
  //
  //     FROM
  //       tiles t
  //         LEFT JOIN villages v ON v.tile_id = t.id
  //         LEFT JOIN players p ON p.id = v.player_id
  //         LEFT JOIN resource_field_compositions rfc ON rfc.id = t.resource_field_composition_id
  //         LEFT JOIN effects_wheat ew ON ew.village_id = v.id
  //         LEFT JOIN oasis_agg oa ON oa.tile_id = t.id
  //         LEFT JOIN oasis_pref op ON op.tile_id = t.id
  //         LEFT JOIN reputation_by_target rb ON rb.target_faction_id = p.faction_id
  //         LEFT JOIN troops_agg ta ON ta.tile_id = t.id
  //         LEFT JOIN bonuses_agg ba ON ba.tile_id = t.id
  //     WHERE
  //       t.id = $tile_id
  //     LIMIT 1;
  //   `,
  //   {
  //     $tile_id: tileId,
  //     $player_id: PLAYER_ID,
  //   }
  // );
  //
  // console.log(performance.now() - b);
  //
  // const a = getTileSchema.parse(row);
  //
  // console.log(a);
  return {};
};

const getTilesSchema = z
  .strictObject({
    id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    type: tileTypeSchema,
    rfc: resourceFieldCompositionSchema.nullable(),
    oasis_graphics: z.number().nullable(),
    player_tribe: tribeSchema.nullable(),
    village_id: z.number().nullable(),
    oasis_resource: resourceSchema.nullable(),
    oasis_occupied: z.number().nullable(),
    population: z.number().nullable(),
    item_id: z.number().nullable(),
    reputation: z.number().nullable(),
  })
  .transform((t) => ({
    id: t.id,
    coordinates: {
      x: t.coordinates_x,
      y: t.coordinates_y,
    },
    type: t.type,
    ...(t.type === 'free' && {
      resourceFieldComposition: t.rfc,
      isOccupied: !!t.village_id,
      tribe: t.player_tribe,
      population: t.population,
      reputation: t.reputation,
      itemId: t.item_id,
    }),
    ...(t.type === 'oasis' && {
      oasisGraphics: t.oasis_graphics,
      oasisResource: t.oasis_resource,
      isOccupied: !!t.oasis_occupied,
    }),
  }));

/**
 * GET /tiles
 */
export const getTiles: Controller<'/tiles'> = (database) => {
  const rows = database.selectObjects(
    `
      WITH
        wheat_id AS (
          SELECT id AS wid
          FROM
            effect_ids
          WHERE
            effect = 'wheatProduction'
          LIMIT 1
          ),

        -- use player_id directly to get the source faction
        src_faction AS (
          SELECT faction_id AS fid
          FROM players
          WHERE id = $player_id
          LIMIT 1
          ),

        -- since exactly one wheat effect per village, pick the row directly
        effects_wheat AS (
          SELECT e.village_id, e.value AS wheat_production_sum
          FROM
            effects e
              JOIN wheat_id w ON e.effect_id = w.wid
          WHERE
            e.scope = 'village'
            AND e.source_specifier = 0
          ),

        -- one item per tile
        world_items_single AS (
          SELECT tile_id, item_id
          FROM
            world_items
          ),

        -- preferred non-wheat oasis per tile (seeded order = min(id))
        oasis_nonwheat_min AS (
          SELECT tile_id, MIN(id) AS min_nonwheat_id
          FROM
            oasis
          WHERE
            resource <> 'wheat'
          GROUP BY tile_id
          ),
        oasis_pref AS (
          SELECT o.tile_id, o.resource AS preferred_non_wheat
          FROM
            oasis o
              JOIN oasis_nonwheat_min m ON m.tile_id = o.tile_id AND m.min_nonwheat_id = o.id
          ),

        -- aggregated oasis metrics (counts, occupied, only_resource fallback)
        oasis_agg AS (
          SELECT
            o.tile_id,
            COUNT(*) AS cnt,
            SUM(CASE WHEN o.village_id IS NOT NULL THEN 1 ELSE 0 END) AS occupied_count,
            MIN(o.resource) AS only_resource
          FROM
            oasis o
          GROUP BY o.tile_id
          ),

        -- reputation for the source faction
        reputation_by_target AS (
          SELECT fr.target_faction_id, fr.reputation
          FROM
            faction_reputation fr
              JOIN src_faction s ON fr.source_faction_id = s.fid
          )

      SELECT
        t.id AS id,
        t.x AS coordinates_x,
        t.y AS coordinates_y,
        t.type AS type,
        rfc.resource_field_composition AS rfc,
        t.oasis_graphics AS oasis_graphics,
        v.id AS village_id,
        p.tribe AS player_tribe,
        CASE WHEN t.type = 'free' AND v.id IS NOT NULL THEN COALESCE(ew.wheat_production_sum, 0) END AS population,
        CASE WHEN t.type = 'free' THEN wi.item_id END AS item_id,
        CASE WHEN t.type = 'free' AND v.id IS NOT NULL THEN rb.reputation END AS reputation,

        -- pick oasis resource: prefer precomputed non-wheat, else only_resource (when cnt=1) else NULL
        CASE
          WHEN oa.cnt IS NULL OR oa.cnt = 0 THEN NULL
          WHEN oa.cnt = 1 THEN oa.only_resource
          ELSE COALESCE(op.preferred_non_wheat, oa.only_resource)
          END AS oasis_resource,
        (oa.occupied_count > 0) AS oasis_occupied

      FROM
        tiles t
          LEFT JOIN villages v ON v.tile_id = t.id
          LEFT JOIN players p ON p.id = v.player_id
          LEFT JOIN resource_field_compositions rfc ON rfc.id = t.resource_field_composition_id
          LEFT JOIN effects_wheat ew ON ew.village_id = v.id
          LEFT JOIN world_items_single wi ON wi.tile_id = t.id
          LEFT JOIN oasis_agg oa ON oa.tile_id = t.id
          LEFT JOIN oasis_pref op ON op.tile_id = t.id
          LEFT JOIN reputation_by_target rb ON rb.target_faction_id = p.faction_id
      ORDER BY
        t.id;
    `,
    {
      $player_id: PLAYER_ID,
    },
  );

  const parsedTiles = z.array(getTilesSchema).parse(rows);

  const mapSize = database.selectValue(
    'SELECT map_size FROM servers LIMIT 1;',
  ) as number;

  const { totalTiles } = calculateGridLayout(mapSize);

  const tiles = Array.from({ length: totalTiles }).fill(null);

  for (const tile of parsedTiles) {
    tiles[tile.id - 1] = tile;
  }

  return tiles;
};
