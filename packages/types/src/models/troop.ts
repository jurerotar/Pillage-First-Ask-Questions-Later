import { z } from 'zod';
import { tileIdSchema } from './tile';
import { unitIdSchema } from './unit';

export const troopSchema = z
  .strictObject({
    unitId: unitIdSchema,
    amount: z.int().positive(),
    tileId: tileIdSchema,
    sourceTileId: tileIdSchema,
  })
  .meta({ id: 'Troop' });

export type Troop = z.infer<typeof troopSchema>;

export type TroopLike = Pick<Troop, 'unitId' | 'amount'> &
  Record<string, unknown>;
