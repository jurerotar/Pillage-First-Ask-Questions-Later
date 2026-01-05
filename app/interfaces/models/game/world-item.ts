import { z } from 'zod';
import { heroItemSchema } from 'app/interfaces/models/game/hero-item';

export const worldItemSchema = heroItemSchema.extend({
  tileId: z.number(),
});

export type WorldItem = z.infer<typeof worldItemSchema>;
