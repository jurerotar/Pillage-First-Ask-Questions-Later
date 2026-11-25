import { z } from 'zod';
import { heroItemSchema } from './hero-item';
import { tileIdSchema } from './tile';

export const worldItemSchema = z
  .strictObject({ ...heroItemSchema.shape, tileId: tileIdSchema })
  .meta({ id: 'WorldItem' });

export type WorldItem = z.infer<typeof worldItemSchema>;
