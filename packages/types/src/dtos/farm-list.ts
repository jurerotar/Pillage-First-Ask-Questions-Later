import { z } from 'zod';
import { tileIdSchema } from '@pillage-first/types/models/tile';

export const farmListDtoSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  villageId: z.number(),
  targetCount: z.number(),
});

export const farmListDetailsDtoSchema = farmListDtoSchema.extend({
  tileIds: z.array(tileIdSchema),
});

export const updateFarmListDtoSchema = z.strictObject({
  name: z.string().min(1).optional(),
  villageId: z.number().optional(),
});
