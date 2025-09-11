import type { ApiHandler } from 'app/interfaces/api';
import type { VillageModel } from 'app/interfaces/models/game/village';
import { villageApiResource } from 'app/(game)/api/api-resources/village-api-resources';
import { z } from 'zod';

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
  })
  .transform((t) => {
    return {
      id: t.id,
      tileId: t.tile_id,
      playerId: t.player_id,
      coordinates: {
        x: t.coordinates_x,
        y: t.coordinates_y,
      },
      name: t.name,
      slug: t.slug,
      resourceFieldComposition: t.resource_field_composition,
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
  ) as VillageModel;

  return villageApiResource(row);
};
