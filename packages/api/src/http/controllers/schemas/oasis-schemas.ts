import { z } from 'zod';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const oasisReinforcementToReturnSchema = z.strictObject({
  unit_id: unitIdSchema,
  amount: z.number().int().min(1),
  source_tile_id: z.number(),
  source_village_id: z.number().nullable(),
});
