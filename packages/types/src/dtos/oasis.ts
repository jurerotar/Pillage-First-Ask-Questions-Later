import { z } from 'zod';
import { coordinatesSchema } from '../models/coordinates';
import { resourceSchema } from '../models/resource';

export const oasisBonusDtoSchema = z
  .strictObject({
    resource: resourceSchema,
    bonus: z.number(),
  })
  .meta({ id: 'OasisBonusDto' });

export const oasisDtoSchema = z
  .strictObject({
    id: z.number(),
    coordinates: coordinatesSchema,
    bonuses: z.array(oasisBonusDtoSchema),
  })
  .meta({ id: 'OasisDto' });

export const occupiableOasisDtoSchema = z
  .strictObject({
    oasis: oasisDtoSchema,
    village: z
      .strictObject({
        id: z.number(),
        name: z.string(),
        slug: z.string(),
        coordinates: coordinatesSchema,
      })
      .nullable(),
    player: z
      .strictObject({
        id: z.number(),
        name: z.string(),
        slug: z.string(),
      })
      .nullable(),
  })
  .meta({ id: 'OccupiableOasisDto' });
