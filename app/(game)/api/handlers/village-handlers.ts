import type { ApiHandler } from 'app/interfaces/api';
import { z } from 'zod';
import { buildingIdSchema } from 'app/interfaces/models/game/building';
import { decodeGraphicsProperty } from 'app/utils/map';
import type { Resource } from 'app/interfaces/models/game/resource';
import { resourceFieldCompositionSchema } from 'app/interfaces/models/game/resource-field-composition';

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

export const getVillageBySlug: ApiHandler<'villageSlug'> = (
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

export const getOccupiableOasisInRange: ApiHandler<'villageId'> = (
  database,
  { params },
) => {
  const { villageId } = params;

  const rows = database.selectObjects(
    `
      SELECT
        ot.id AS tile_id,
        ot.x AS tile_coordinates_x,
        ot.y AS tile_coordinates_y,
        ot.oasis_graphics AS oasis_graphics,
        JSON_GROUP_ARRAY(o.bonus) AS bonuses_json,

        -- occupied village (NULL when unoccupied)
        (
          SELECT o2.village_id
          FROM
            oasis o2
          WHERE
            o2.tile_id = ot.id
            AND o2.village_id IS NOT NULL
          LIMIT 1
          ) AS occupying_village_id,
        v2.name AS occupying_village_name,
        v2.slug AS occupying_village_slug,
        vt2.x AS occupying_village_coordinates_x,
        vt2.y AS occupying_village_coordinates_y,
        p.id AS occupying_player_id,
        p.name AS occupying_player_name,
        p.slug AS occupying_player_slug
      FROM
        villages AS center_v
          JOIN tiles AS center_t ON center_v.tile_id = center_t.id
          JOIN tiles AS ot
               ON ot.type = 'oasis'
                 AND ot.x BETWEEN center_t.x - $radius AND center_t.x + $radius
                 AND ot.y BETWEEN center_t.y - $radius AND center_t.y + $radius
          JOIN oasis AS o ON o.tile_id = ot.id
          LEFT JOIN villages AS v2 ON v2.id =
                                      (
                                        SELECT o3.village_id
                                        FROM
                                          oasis o3
                                        WHERE
                                          o3.tile_id = ot.id
                                          AND o3.village_id IS NOT NULL
                                        LIMIT 1
                                        )
          LEFT JOIN tiles AS vt2 ON v2.tile_id = vt2.id
          LEFT JOIN players AS p ON v2.player_id = p.id
      WHERE
        center_v.id = $village_id
      GROUP BY
        ot.id, ot.x, ot.y, ot.oasis_graphics,
        occupying_village_id,
        v2.name, v2.slug, vt2.x, vt2.y,
        p.id, p.name, p.slug
      ORDER BY
        (ABS(ot.x - center_t.x) + ABS(ot.y - center_t.y)), ot.id;
    `,
    {
      $village_id: villageId,
      $radius: 3,
    },
  );

  return z.array(getOccupiableOasisInRangeSchema).parse(rows);
};
