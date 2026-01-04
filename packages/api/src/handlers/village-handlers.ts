import { z } from 'zod';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import type { Resource } from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { decodeGraphicsProperty } from '@pillage-first/utils/map';
import type { Controller } from '../types/handler';

const buildingFieldRowSchema = z.strictObject({
  field_id: z.number(),
  building_id: buildingIdSchema,
  level: z.number(),
});

const getVillageBySlugSchema = z
  .strictObject({
    id: z.number(),
    tile_id: z.number(),
    player_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    name: z.string(),
    slug: z.string(),
    resource_field_composition: resourceFieldCompositionSchema,
    last_updated_at: z.number(),
    wood: z.number(),
    clay: z.number(),
    iron: z.number(),
    wheat: z.number(),
    building_fields: z
      .string()
      .transform((s) => (s ? JSON.parse(s) : []))
      .pipe(z.array(buildingFieldRowSchema)),
  })
  .transform((t) => {
    return {
      id: t.id,
      tileId: t.tile_id,
      playerId: t.player_id,
      name: t.name,
      slug: t.slug,
      coordinates: {
        x: t.coordinates_x,
        y: t.coordinates_y,
      },
      lastUpdatedAt: t.last_updated_at,
      resources: {
        wood: t.wood,
        clay: t.clay,
        iron: t.iron,
        wheat: t.wheat,
      },
      resourceFieldComposition: t.resource_field_composition,
      buildingFields: t.building_fields.map((bf) => ({
        id: bf.field_id,
        buildingId: bf.building_id,
        level: bf.level,
      })),
    };
  });

/**
 * GET /villages/:villageSlug
 * @pathParam {string} villageSlug
 */
export const getVillageBySlug: Controller<'/villages/:villageSlug'> = (
  database,
  { params },
) => {
  const { villageSlug } = params;

  const row = database.selectObject(
    `
      SELECT
        v.id,
        v.tile_id,
        v.player_id,
        t.x AS coordinates_x,
        t.y AS coordinates_y,
        v.name,
        v.slug,
        rs.updated_at AS last_updated_at,
        rs.wood AS wood,
        rs.clay AS clay,
        rs.iron AS iron,
        rs.wheat AS wheat,
        rfc.resource_field_composition AS resource_field_composition,
        (
          SELECT
            JSON_GROUP_ARRAY(
              JSON_OBJECT(
                'field_id', bf.field_id,
                'building_id', bf.building_id,
                'level', bf.level
              )
            )
          FROM
            building_fields bf
          WHERE
            bf.village_id = v.id
          ) AS building_fields
      FROM
        villages v
          JOIN tiles t
               ON t.id = v.tile_id
          LEFT JOIN resource_sites rs
                    ON rs.tile_id = v.tile_id
          LEFT JOIN resource_field_compositions rfc
                    ON t.resource_field_composition_id = rfc.id
      WHERE
        v.slug = $slug
      LIMIT 1;
    `,
    { $slug: villageSlug },
  );

  return getVillageBySlugSchema.parse(row);
};

const getOccupiableOasisInRangeSchema = z
  .strictObject({
    tile_id: z.number(),
    tile_coordinates_x: z.number(),
    tile_coordinates_y: z.number(),
    bonuses_json: z.string(),
    oasis_graphics: z.number(),
    occupying_village_id: z.number().nullable(),
    occupying_village_coordinates_x: z.number().nullable(),
    occupying_village_coordinates_y: z.number().nullable(),
    occupying_village_name: z.string().nullable(),
    occupying_village_slug: z.string().nullable(),
    occupying_player_id: z.number().nullable(),
    occupying_player_name: z.string().nullable(),
    occupying_player_slug: z.string().nullable(),
  })
  .transform((t) => {
    const { oasisResource } = decodeGraphicsProperty(t.oasis_graphics);
    const parsedBonuses = JSON.parse(t.bonuses_json) as number[];

    const firstBonus = parsedBonuses.at(0)!;
    const secondBonus = parsedBonuses.at(1);

    // First bonus is always either 50% or 25% and of a specific resource
    const bonuses: { resource: Resource; bonus: number }[] = [
      {
        resource: oasisResource,
        bonus: firstBonus,
      },
    ];

    // If second bonus exists, we know it's a 25% and it must be wheat
    if (secondBonus) {
      bonuses.push({
        resource: 'wheat',
        bonus: 25,
      });
    }

    return {
      oasis: {
        id: t.tile_id,
        coordinates: {
          x: t.tile_coordinates_x,
          y: t.tile_coordinates_y,
        },
        bonuses,
      },
      player:
        t.occupying_player_id === null
          ? null
          : {
              id: t.occupying_player_id,
              name: t.occupying_player_name,
              slug: t.occupying_player_slug,
            },
      village:
        t.occupying_village_id === null
          ? null
          : {
              id: t.occupying_village_id,
              coordinates: {
                x: t.occupying_village_coordinates_x,
                y: t.occupying_village_coordinates_y,
              },
              name: t.occupying_village_name,
              slug: t.occupying_village_slug,
            },
    };
  });

/**
 * GET /villages/:villageId/occupiable-oasis
 * @pathParam {number} villageId
 */
export const getOccupiableOasisInRange: Controller<
  '/villages/:villageId/occupiable-oasis'
> = (database, { params }) => {
  const { villageId } = params;

  const rows = database.selectObjects(
    `
      WITH src_village AS (
        SELECT t.id AS vtile, t.x AS vx, t.y AS vy
        FROM villages v
               JOIN tiles t ON t.id = v.tile_id
        WHERE v.id = $village_id
        LIMIT 1
        ),

        -- aggregate oasis info (bonuses + occupying village) but only those occupiable by this village tile
        oasis_agg AS (
          SELECT
            ot.id AS tile_id,
            ot.x AS x,
            ot.y AS y,
            ot.oasis_graphics AS oasis_graphics,
            JSON_GROUP_ARRAY(o.bonus) AS bonuses_json,
            MAX(o.village_id) AS occupying_village_id
          FROM tiles ot
                 JOIN src_village sv ON 1=1
                 JOIN oasis_occupiable_by ob ON ob.oasis_id = ot.id AND ob.tile_id = sv.vtile
                 JOIN oasis o ON o.tile_id = ot.id
          WHERE ot.type = 'oasis'
            AND ot.x BETWEEN sv.vx - $radius AND sv.vx + $radius
            AND ot.y BETWEEN sv.vy - $radius AND sv.vy + $radius
          GROUP BY ot.id
          )

      SELECT
        oa.tile_id,
        oa.x AS tile_coordinates_x,
        oa.y AS tile_coordinates_y,
        oa.oasis_graphics,
        oa.bonuses_json,

        oa.occupying_village_id,
        v2.name AS occupying_village_name,
        v2.slug AS occupying_village_slug,
        vt2.x AS occupying_village_coordinates_x,
        vt2.y AS occupying_village_coordinates_y,
        p.id   AS occupying_player_id,
        p.name AS occupying_player_name,
        p.slug AS occupying_player_slug
      FROM oasis_agg oa
             CROSS JOIN src_village sv
             LEFT JOIN villages v2 ON v2.id = oa.occupying_village_id
             LEFT JOIN tiles vt2 ON vt2.id = v2.tile_id
             LEFT JOIN players p ON p.id = v2.player_id
      ORDER BY
        (ABS(oa.x - sv.vx) + ABS(oa.y - sv.vy)),
        oa.tile_id;
    `,
    {
      $village_id: villageId,
      $radius: 3,
    },
  );

  return z.array(getOccupiableOasisInRangeSchema).parse(rows);
};
