import { z } from 'zod';
import { coordinatesSchema } from '../models/coordinates';
import { resourceSchema } from '../models/resource';
import { resourceFieldCompositionSchema } from '../models/resource-field-composition';
import { oasisBonusTypeSchema } from '../models/tile';
import { natureUnitIdSchema } from '../models/unit';

export const oasisByBonusSearchResultOasisDtoSchema = z.strictObject({
  tileId: z.number(),
  coordinates: coordinatesSchema,
  resource: resourceSchema,
  bonusType: oasisBonusTypeSchema,
  isOccupied: z.boolean(),
});

export const oasisByBonusSearchResultOwnerVillageDtoSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  slug: z.string().nullable(),
  coordinates: coordinatesSchema,
});

export const oasisByBonusSearchResultItemDtoSchema = z
  .strictObject({
    tileId: z.number(),
    coordinates: coordinatesSchema,
    resourceFieldComposition: resourceFieldCompositionSchema,
    ownerVillage: oasisByBonusSearchResultOwnerVillageDtoSchema.nullable(),
    nearbyOases: z.array(oasisByBonusSearchResultOasisDtoSchema),
    distance: z.number(),
  })
  .meta({ id: 'OasisByBonusSearchResultItemDto' });

export const oasisByAnimalsSearchResultItemDtoSchema = z
  .strictObject({
    tileId: z.number(),
    coordinates: coordinatesSchema,
    resource: resourceSchema,
    bonusType: oasisBonusTypeSchema,
    animals: z.array(
      z.strictObject({
        unitId: natureUnitIdSchema,
        amount: z.number(),
      }),
    ),
    distance: z.number(),
  })
  .meta({ id: 'OasisByAnimalsSearchResultItemDto' });
