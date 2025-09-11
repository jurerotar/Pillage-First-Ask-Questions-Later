import type { ApiHandler } from 'app/interfaces/api';
import { z } from 'zod';

const buildingFieldRowSchema = z.object({
  field_id: z.number(),
  building_id: z.string(),
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
    resource_field_composition: z.string(),
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

export const getVillageBySlug: ApiHandler<
  z.infer<typeof getVillageBySlugSchema>,
  'villageSlug'
> = async (_queryClient, database, { params }) => {
  const { villageSlug } = params;

  const row = database.selectObject(
    `
      SELECT
        v.id,
        v.tile_id,
        v.player_id,
        t.x  AS coordinates_x,
        t.y  AS coordinates_y,
        v.name,
        v.slug,
        rs.updated_at AS last_updated_at,
        rs.wood AS wood,
        rs.clay AS clay,
        rs.iron AS iron,
        rs.wheat AS wheat,
        t.resource_field_composition,
        (
          SELECT json_group_array(
                   json_object(
                     'field_id',    bf.field_id,
                     'building_id', bf.building_id,
                     'level',       bf.level
                   )
                 )
          FROM building_fields bf
          WHERE bf.village_id = v.id
        ) AS building_fields
      FROM villages v
      JOIN tiles t
        ON t.id = v.tile_id
      LEFT JOIN resource_sites rs
        ON rs.tile_id = v.tile_id
      WHERE v.slug = $slug
      LIMIT 1;
    `,
    { $slug: villageSlug },
  );

  return getVillageBySlugSchema.parse(row);
};
