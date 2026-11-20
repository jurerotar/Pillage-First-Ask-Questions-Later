import { z } from 'zod';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { buildingIdSchema } from '../models/building';
import { buildingFieldSchema } from '../models/building-field';
import { coordinatesSchema } from '../models/coordinates';
import { resourceSchema, resourcesSchema } from '../models/resource';
import { resourceFieldCompositionSchema } from '../models/resource-field-composition';

export const rearrangeBuildingFieldsDtoSchema = z
  .array(
    z.strictObject({
      buildingFieldId: z.int().positive(),
      buildingId: buildingIdSchema.nullable(),
      sourceBuildingFieldId: z.int().positive().nullable(),
    }),
  )
  .refine(
    (updates) => {
      const sourceFieldIds = new Set<number>();

      for (const {
        buildingFieldId,
        buildingId,
        sourceBuildingFieldId,
      } of updates) {
        // Rearrangement ignores resource fields, the rally point, and the wall.
        if (
          buildingFieldId < 19 ||
          buildingFieldId > 38 ||
          buildingId === null ||
          sourceBuildingFieldId === null
        ) {
          continue;
        }

        if (sourceFieldIds.has(sourceBuildingFieldId)) {
          return false;
        }

        sourceFieldIds.add(sourceBuildingFieldId);
      }

      return true;
    },
    { message: 'Duplicate rearranged building source field' },
  );

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
