import { z } from 'zod';
import { resourceSchema } from '@pillage-first/types/models/resource';
import {
  oasisBonusTypeSchema,
  tileIdSchema,
} from '@pillage-first/types/models/tile';

export const getOasesWithAnimalsRowSchema = z
  .strictObject({
    tile_id: tileIdSchema,
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    resource: resourceSchema,
    bonus_type: oasisBonusTypeSchema,
    animals_json: z.string(),
    distance_squared: z.number(),
  })
  .meta({ id: 'GetOasesWithAnimalsRow' });
