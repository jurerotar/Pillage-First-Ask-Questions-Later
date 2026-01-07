import { z } from 'zod';
import { factionSchema } from './faction';
import { tribeSchema } from './tribe';

export const playerSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  tribe: tribeSchema,
  faction: factionSchema,
});

export type Player = z.infer<typeof playerSchema>;
