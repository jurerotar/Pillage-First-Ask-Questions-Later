import { buildingFieldSchema } from 'app/interfaces/models/game/building-field';
import { z } from 'zod';
import { resourceFieldCompositionSchema } from 'app/interfaces/models/game/resource-field-composition';
import { coordinatesSchema } from 'app/interfaces/models/common';

// Used mostly in seeders
export type VillageSize =
  | 'xxs'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl';

export const villageSchema = z.strictObject({
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

export type Village = z.infer<typeof villageSchema>;
