import { z } from 'zod';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const oasisReinforcementToReturnSchema = z.strictObject({
  unit_id: unitIdSchema,
  amount: z.number().int().min(1),
  source_tile_id: tileIdSchema,
  source_village_id: z.number().nullable(),
});
