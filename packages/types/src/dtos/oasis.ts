import { z } from 'zod';
import { coordinatesSchema } from '../models/coordinates';
import { resourceSchema } from '../models/resource';
import { oasisBonusTypeSchema } from '../models/tile';

export const oasisDtoSchema = z
  .strictObject({
    id: z.number(),
    coordinates: coordinatesSchema,
    resource: resourceSchema,
    bonusType: oasisBonusTypeSchema,
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
