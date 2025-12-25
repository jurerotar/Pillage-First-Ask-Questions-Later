import { z } from 'zod';
import { factionSchema } from 'app/interfaces/models/game/faction';
import { tribeSchema } from 'app/interfaces/models/game/tribe';

export const playerSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  tribe: tribeSchema,
  faction: factionSchema,
});

export type Player = z.infer<typeof playerSchema>;
