import { z } from 'zod';
import { coordinatesSchema } from '../models/coordinates';
import { resourceFieldCompositionSchema } from '../models/resource-field-composition';
import { unitIdSchema } from '../models/unit';

export const playerVillageDtoSchema = z.strictObject({
  id: z.number(),
  tileId: z.number(),
  coordinates: coordinatesSchema,
  name: z.string(),
  slug: z.string(),
  resourceFieldComposition: resourceFieldCompositionSchema,
});

export const playerVillageWithPopulationDtoSchema =
  playerVillageDtoSchema.extend({
    population: z.number(),
  });

export const villageTroopDtoSchema = z.strictObject({
  unitId: unitIdSchema,
  amount: z.number(),
  tileId: z.number(),
  source: z.number(),
});
