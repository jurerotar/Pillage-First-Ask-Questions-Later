import { z } from 'zod';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { buildingFieldSchema } from '../models/building-field';
import { coordinatesSchema } from '../models/coordinates';
import { resourceSchema, resourcesSchema } from '../models/resource';
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
  tileId: tileIdSchema,
  playerId: z.number(),
  name: z.string(),
  slug: z.string(),
  coordinates: coordinatesSchema,
  lastUpdatedAt: z.number(),
  resources: resourcesSchema,
  resourceFieldComposition: resourceFieldCompositionSchema,
  buildingFields: z.array(buildingFieldSchema),
});

export const villageCulturePointsDtoSchema = z.strictObject({
  culturePoints: z.number(),
  villageCount: z.number(),
  currentVillageCulturePointsProduction: z.number(),
  playerCulturePointsProduction: z.number(),
  currentVillageCulturePointsRequirement: z.number(),
  nextVillageCulturePointsRequirement: z.number(),
});
