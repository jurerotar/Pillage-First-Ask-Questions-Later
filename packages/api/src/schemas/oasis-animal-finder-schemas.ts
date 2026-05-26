import { z } from 'zod';

export const getOasesWithAnimalsRowSchema = z
  .strictObject({
    tile_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    bonuses_json: z.string(),
    animals_json: z.string(),
    distance_squared: z.number(),
  })
  .meta({ id: 'GetOasesWithAnimalsRow' });
