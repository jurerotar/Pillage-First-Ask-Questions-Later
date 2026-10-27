import { z } from 'zod';
import { buildingFieldSchema } from '../models/building-field';
import { coordinatesSchema } from '../models/coordinates';
import { resourceSchema } from '../models/resource';
import { resourceFieldCompositionSchema } from '../models/resource-field-composition';

export const villageStorageResourceDtoSchema = z.strictObject({
  resource: resourceSchema,
  incoming: z.strictObject({
    gathering: z.number(),
    marketplace: z.number(),
    troops: z.number(),
  }),
  fullAt: z.number().nullable(),
  emptyAt: z.number().nullable(),
});

export const villageStorageDtoSchema = z.strictObject({
  calculatedAt: z.number(),
  resources: z.array(villageStorageResourceDtoSchema),
});

export type VillageStorageResourceDto = z.infer<
  typeof villageStorageResourceDtoSchema
>;

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
