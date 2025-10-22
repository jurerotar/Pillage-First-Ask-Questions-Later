import { unitIdSchema } from 'app/interfaces/models/game/unit';
import { z } from 'zod';

export const troopSchema = z.strictObject({
  unitId: unitIdSchema,
  amount: z.number().min(1),
  tileId: z.number(),
  source: z.number(),
});

export type Troop = z.infer<typeof troopSchema>;
