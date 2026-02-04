import { z } from 'zod';
import { heroItemSchema } from './hero-item';

export const worldItemSchema = heroItemSchema.extend({
  tileId: z.number(),
}).meta({ id: 'WorldItem' });

export type WorldItem = z.infer<typeof worldItemSchema>;
