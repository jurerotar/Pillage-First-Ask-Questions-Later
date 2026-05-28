import { z } from 'zod';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';

export const getTilesWithBonusesRowSchema = z
  .strictObject({
    tile_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    resource_field_composition: resourceFieldCompositionSchema,
    distance_squared: z.number(),
  })
  .meta({ id: 'GetTilesWithBonusesRow' });
