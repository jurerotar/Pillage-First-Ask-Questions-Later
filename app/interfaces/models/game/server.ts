import { tribeSchema } from 'app/interfaces/models/game/tribe';
import { z } from 'zod';

export const serverSchema = z.strictObject({
  id: z.string(),
  version: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.number(),
  seed: z.string(),
  configuration: z.strictObject({
    mapSize: z.union([z.literal(100), z.literal(200), z.literal(300)]),
    speed: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(5),
      z.literal(10),
    ]),
  }),
  playerConfiguration: z.strictObject({
    name: z.string(),
    tribe: tribeSchema,
  }),
});

export type Server = z.infer<typeof serverSchema>;
