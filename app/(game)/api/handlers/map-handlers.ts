import type { ApiHandler } from 'app/interfaces/api';
import { type Tile, tileTypeSchema } from 'app/interfaces/models/game/tile';
import {
  mapCacheKey,
  playersCacheKey,
  reputationsCacheKey,
  troopsCacheKey,
  villagesCacheKey,
  artifactsInVicinityCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import type { Player } from 'app/interfaces/models/game/player';
import type { Village } from 'app/interfaces/models/game/village';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { isOccupiedOasisTile } from 'app/(game)/(village-slug)/utils/guards/map-guards';
import type { Troop } from 'app/interfaces/models/game/troop';
import { z } from 'zod';
import { resourceFieldCompositionSchema } from 'app/interfaces/models/game/resource-field-composition';
import { tribeSchema } from 'app/interfaces/models/game/tribe';
import { resourceSchema } from 'app/interfaces/models/game/resource';

export const getTilePlayer: ApiHandler<'tileId'> = (_database, { params }) => {
  const { tileId } = params;

  const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;
  const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;
  const reputations = queryClient.getQueryData<Reputation[]>([
    reputationsCacheKey,
  ])!;

  const tile = tiles.find((tile) => tile.id === tileId)!;

  const village = (() => {
    if (isOccupiedOasisTile(tile)) {
      const owningTile = tiles.find((t) => t.id === tile.villageId)!;
      return villages.find(
        ({ coordinates }) =>
          owningTile.coordinates.x === coordinates.x &&
          owningTile.coordinates.y === coordinates.y,
      )!;
    }

    return villages.find(
      ({ coordinates }) =>
        tile.coordinates.x === coordinates.x &&
        tile.coordinates.y === coordinates.y,
    )!;
  })();

  const player = players.find((player) => village.playerId === player.id)!;
  const reputation = reputations.find(
    (reputation) => reputation.faction === player.faction,
  )!;

  return {
    player,
    reputation,
    village,
    population,
  };
};

export const getTileTroops: ApiHandler<'tileId'> = (_database, { params }) => {
  const { tileId } = params;

  const troops = queryClient.getQueryData<Troop[]>([troopsCacheKey])!;

  return troops.filter((troop) => troop.tileId === tileId);
};

export const getTileWorldItem: ApiHandler<WorldItem | null, 'tileId'> = (
  _database,
  { params },
) => {
  const { tileId } = params;

  const worldItems = queryClient.getQueryData<WorldItem[]>([
    artifactsInVicinityCacheKey,
  ])!;

  return worldItems.find((worldItem) => worldItem.tileId === tileId) ?? null;
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
    item_type: z.string().nullable(),
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
      itemType: t.item_type,
    }),
    ...(t.type === 'oasis' && {
      oasisGraphics: t.oasis_graphics,
      oasisResource: t.oasis_resource,
      isOccupied: !!t.oasis_occupied,
    }),
  }));

// const borderTilesSchema = z.strictObject({
//   id: z.number(),
//   oasis_graphics: z.number(),
// });

export const getContextualMap: ApiHandler<'villageId'> = (
  database,
  { params },
) => {
  const { villageId } = params;

  const rows = database.selectObjects(
    `
      WITH
        wheat_id AS (
          SELECT id AS wid FROM effect_ids WHERE effect = 'wheatProduction' LIMIT 1
          ),
        src_faction AS (
          SELECT p.faction_id AS fid
          FROM villages sv
                 JOIN players p ON p.id = sv.player_id
          WHERE sv.id = $village_id
          LIMIT 1
          ),

        -- since exactly one wheat effect per village, pick the row directly
        effects_wheat AS (
          SELECT e.village_id, e.value AS wheat_production_sum
          FROM effects e
                 JOIN wheat_id w ON e.effect_id = w.wid
          WHERE e.scope = 'village' AND e.source_specifier = 0
          ),

        -- one item per tile
        world_items_single AS (
          SELECT tile_id, type AS item_type
          FROM world_items
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
          ),

        -- reputation for the source faction
        reputation_by_target AS (
          SELECT fr.target_faction_id, fr.reputation
          FROM faction_reputation fr
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

        CASE WHEN t.type = 'free' THEN wi.item_type END AS item_type,

        CASE WHEN t.type = 'free' AND v.id IS NOT NULL THEN rb.reputation END AS reputation,

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
             LEFT JOIN reputation_by_target rb ON rb.target_faction_id = p.faction_id
      ORDER BY t.id;
    `,
    {
      $village_id: villageId,
    },
  );

  return z.array(getTilesSchema).parse(rows);
};
