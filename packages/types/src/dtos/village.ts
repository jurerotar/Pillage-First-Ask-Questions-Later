import { z } from 'zod';
import { buildingFieldSchema } from '../models/building-field';
import { coordinatesSchema } from '../models/coordinates';
import { resourceFieldCompositionSchema } from '../models/resource-field-composition';

export const villageBySlugDtoSchema = z.strictObject({
  id: z.number(),
  tileId: z.number(),
  playerId: z.number(),
  name: z.string(),
  slug: z.string(),
  coordinates: coordinatesSchema,
  lastUpdatedAt: z.number(),
  resources: z.strictObject({
    wood: z.number(),
    clay: z.number(),
    iron: z.number(),
    wheat: z.number(),
  }),
  resourceFieldComposition: resourceFieldCompositionSchema,
  buildingFields: z.array(buildingFieldSchema),
});
