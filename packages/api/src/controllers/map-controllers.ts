import { z } from 'zod';
import { factionSchema } from '@pillage-first/types/models/faction';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { tileTypeSchema } from '@pillage-first/types/models/tile';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import { calculateGridLayout } from '@pillage-first/utils/map';
import type { Controller } from '../types/controller';

const getTilesSchema = z
  .strictObject({
    id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    type: tileTypeSchema,

    rfc: resourceFieldCompositionSchema.nullable(),
    oasis_graphics: z.number().nullable(),
    oasis_resource: resourceSchema.nullable(),
    oasis_occupied: z.number().nullable(),

    player_id: z.number().nullable(),
    player_slug: z.string().nullable(),
    player_name: z.string().nullable(),
    player_tribe: tribeSchema.nullable(),
    player_faction: factionSchema.nullable(),

    village_id: z.number().nullable(),
    village_name: z.string().nullable(),
    village_slug: z.string().nullable(),
    population: z.number().nullable(),

    item_id: z.number().nullable(),
  })
  .transform((t) => {
    const isOccupiableTile = t.type === 'free';
    const isOasisTile = !isOccupiableTile;

    const isOccupied = !!t.player_id;

    return {
      id: t.id,
      type: t.type,
      coordinates: {
        x: t.coordinates_x,
        y: t.coordinates_y,
      },
      ...(isOccupiableTile && {
        attributes: {
          resourceFieldComposition: t.rfc,
        },
        item:
          t.item_id === null
            ? null
            : {
                id: t.item_id,
              },
      }),
      ...(isOasisTile && {
        attributes: {
          oasisGraphics: t.oasis_graphics,
          oasisResource: t.oasis_resource,
        },
      }),
      ...(isOccupied && {
        owner: {
          id: t.player_id,
          name: t.player_name,
          slug: t.player_slug,
          tribe: t.player_tribe,
          faction: t.player_faction,
        },
        ownerVillage: {
          id: t.village_id,
          name: t.village_name,
          slug: t.village_slug,
          population: t.population,
        },
      }),
      ...(!isOccupied && {
        owner: null,
        ownerVillage: null,
      }),
    };
  });

/**
 * GET /tiles
 */
export const getTiles: Controller<'/tiles'> = (database) => {
  const rows = database.selectObjects(
    `
      WITH
        wheat_id AS (
          SELECT id AS wid
          FROM effect_ids
          WHERE effect = 'wheatProduction'
          LIMIT 1
          ),

        -- since exactly one wheat effect per village, pick the row directly
        effects_wheat AS (
          SELECT e.village_id, -e.value AS wheat_production_sum
          FROM effects e
                 JOIN wheat_id w ON e.effect_id = w.wid
          WHERE e.scope = 'village'
            AND e.source_specifier = 0
          ),

        -- one (deterministic) item per tile (if any)
        world_items_single AS (
          SELECT tile_id, MIN(item_id) AS item_id
          FROM world_items
          GROUP BY tile_id
          ),

        -- preferred non-wheat oasis per tile (seeded order = min(id))
        oasis_nonwheat_min AS (
          SELECT tile_id, MIN(id) AS min_nonwheat_id
          FROM oasis
          WHERE resource <> 'wheat'
          GROUP BY tile_id
          ),
        oasis_pref AS (
          SELECT o.tile_id, o.resource AS preferred_non_wheat
          FROM oasis o
                 JOIN oasis_nonwheat_min m ON m.tile_id = o.tile_id AND m.min_nonwheat_id = o.id
          ),

        -- aggregated oasis metrics (counts, occupied, only_resource fallback)
        oasis_agg AS (
          SELECT
            o.tile_id,
            COUNT(*) AS cnt,
            SUM(CASE WHEN o.village_id IS NOT NULL THEN 1 ELSE 0 END) AS occupied_count,
            MIN(o.resource) AS only_resource
          FROM oasis o
          GROUP BY o.tile_id
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
        (
          SELECT f.faction
          FROM factions f
          WHERE f.id = p.faction_id
          ) AS player_faction,
        CASE WHEN t.type = 'free' AND v.id IS NOT NULL THEN COALESCE(ew.wheat_production_sum, 0) END AS population,
        CASE WHEN t.type = 'free' THEN wi.item_id END AS item_id,

        -- pick oasis resource: prefer precomputed non-wheat, else only_resource (when cnt=1) else NULL
        CASE
          WHEN oa.cnt IS NULL OR oa.cnt = 0 THEN NULL
          WHEN oa.cnt = 1 THEN oa.only_resource
          ELSE COALESCE(op.preferred_non_wheat, oa.only_resource)
          END AS oasis_resource,
        (oa.occupied_count > 0) AS oasis_occupied

      FROM tiles t
             LEFT JOIN villages v ON v.tile_id = t.id
             LEFT JOIN players p ON p.id = v.player_id
             LEFT JOIN resource_field_compositions rfc ON rfc.id = t.resource_field_composition_id
             LEFT JOIN effects_wheat ew ON ew.village_id = v.id
             LEFT JOIN world_items_single wi ON wi.tile_id = t.id
             LEFT JOIN oasis_agg oa ON oa.tile_id = t.id
             LEFT JOIN oasis_pref op ON op.tile_id = t.id
      ORDER BY t.id;
    `,
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

const getTileTroopsSchema = z
  .strictObject({
    unit_id: unitIdSchema,
    amount: z.number(),
    tile_id: z.number(),
    source_tile_id: z.number(),
  })
  .transform((t) => ({
    unitId: t.unit_id,
    amount: t.amount,
    tileId: t.tile_id,
    source: t.source_tile_id,
  }));

/**
 * GET /tiles/:tileId/troops
 * @pathParam {number} tileId
 */
export const getTileTroops: Controller<'/tiles/:tileId/troops'> = (
  database,
  { params },
) => {
  const { tileId } = params;

  const rows = database.selectObjects(
    `
    SELECT unit_id, amount, tile_id, source_tile_id
    FROM troops
    WHERE tile_id = $tile_id
    GROUP BY unit_id;
    `,
    {
      $tile_id: tileId,
    },
  );

  return z.array(getTileTroopsSchema).parse(rows);
};

const getTileOasisBonusesSchema = z
  .strictObject({
    resource: resourceSchema,
    bonus: z.number(),
  })
  .transform((t) => ({
    resource: t.resource,
    bonus: t.bonus,
  }));

/**
 * GET /tiles/:tileId/bonuses
 * @pathParam {number} tileId
 */
export const getTileOasisBonuses: Controller<'/tiles/:tileId/bonuses'> = (
  database,
  { params },
) => {
  const { tileId } = params;

  const rows = database.selectObjects(
    `
    SELECT resource, bonus
    FROM oasis
    WHERE tile_id = $tile_id;
    `,
    {
      $tile_id: tileId,
    },
  );

  return z.array(getTileOasisBonusesSchema).parse(rows);
};

const getTileWorldItemSchema = z
  .strictObject({
    item_id: z.number(),
    amount: z.number(),
  })
  .transform((t) => ({
    id: t.item_id,
    amount: t.amount,
  }));

/**
 * GET /tiles/:tileId/world-item
 * @pathParam {number} tileId
 */
export const getTileWorldItem: Controller<'/tiles/:tileId/world-item'> = (
  database,
  { params },
) => {
  const { tileId } = params;

  const row = database.selectObject(
    `
    SELECT item_id, amount
    FROM world_items
    WHERE tile_id = $tile_id
    LIMIT 1;
    `,
    {
      $tile_id: tileId,
    },
  );

  if (!row) {
    return null;
  }

  return getTileWorldItemSchema.parse(row);
};
