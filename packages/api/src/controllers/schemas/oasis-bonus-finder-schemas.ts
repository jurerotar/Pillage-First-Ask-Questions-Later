import { z } from 'zod';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { roundToNDecimalPoints } from '@pillage-first/utils/math';

export const getTilesWithBonusesSchema = z
  .strictObject({
    tile_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    resource_field_composition: resourceFieldCompositionSchema,
    distance_squared: z.number(),
  })
  .transform((t) => ({
    tileId: t.tile_id,
    coordinates: {
      x: t.coordinates_x,
      y: t.coordinates_y,
    },
    resourceFieldComposition: t.resource_field_composition,
    distance: roundToNDecimalPoints(Math.sqrt(t.distance_squared), 2),
  }))
  .pipe(
    z.object({
      tileId: z.number(),
      coordinates: z.object({
        x: z.number(),
        y: z.number(),
      }),
      resourceFieldComposition: resourceFieldCompositionSchema,
      distance: z.number(),
    }),
  )
  .meta({ id: 'GetTilesWithBonuses' });
