import { z } from 'zod';
import { coordinatesSchema } from '../models/coordinates';
import { resourceSchema } from '../models/resource';
import { resourceFieldCompositionSchema } from '../models/resource-field-composition';
import { natureUnitIdSchema } from '../models/unit';

export const oasisByBonusSearchResultItemDtoSchema = z
  .strictObject({
    tileId: z.number(),
    coordinates: coordinatesSchema,
    resourceFieldComposition: resourceFieldCompositionSchema,
    distance: z.number(),
  })
  .meta({ id: 'OasisByBonusSearchResultItemDto' });

export const oasisByAnimalsSearchResultItemDtoSchema = z
  .strictObject({
    tileId: z.number(),
    coordinates: coordinatesSchema,
    bonuses: z.array(
      z.strictObject({
        resource: resourceSchema,
        bonus: z.number(),
      }),
    ),
    animals: z.array(
      z.strictObject({
        unitId: natureUnitIdSchema,
        amount: z.number(),
      }),
    ),
    distance: z.number(),
  })
  .meta({ id: 'OasisByAnimalsSearchResultItemDto' });
