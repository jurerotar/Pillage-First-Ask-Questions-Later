import { z } from 'zod';
import { unitIdSchema } from './unit';

export const troopSchema = z.strictObject({
  unitId: unitIdSchema,
  amount: z.number().min(1),
  tileId: z.number(),
  source: z.number(),
}).meta({ id: 'Troop' });

export type Troop = z.infer<typeof troopSchema>;
