import { z } from 'zod';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { oasisBonusTypeSchema } from '@pillage-first/types/models/tile';

export const buildingFieldRowSchema = z.strictObject({
  field_id: z.number(),
  building_id: buildingIdSchema,
  level: z.number(),
});

// Note: response schemas have moved to @pillage-first/types/dtos. This file should
// define only raw DB/result-set validation for controllers.

export const getVillageBySlugSchema = z
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
    // JSON string aggregated in SQL, mapping is handled in controller mapper
    building_fields: z.string(),
  })
  .meta({ id: 'GetVillageBySlugDbRow' });

export const getOccupiableOasisInRangeRowSchema = z
  .strictObject({
    tile_id: z.number(),
    tile_coordinates_x: z.number(),
    tile_coordinates_y: z.number(),
    resource: resourceSchema,
    bonus_type: oasisBonusTypeSchema,
    occupying_village_id: z.number().nullable(),
    occupying_village_coordinates_x: z.number().nullable(),
    occupying_village_coordinates_y: z.number().nullable(),
    occupying_village_name: z.string().nullable(),
    occupying_village_slug: z.string().nullable(),
    occupying_player_id: z.number().nullable(),
    occupying_player_name: z.string().nullable(),
    occupying_player_slug: z.string().nullable(),
  })
  .meta({ id: 'GetOccupiableOasisInRangeRow' });
