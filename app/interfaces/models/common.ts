import { z } from 'zod';

export const coordinatesSchema = z.strictObject({
  x: z.number(),
  y: z.number(),
});

export type Point = z.infer<typeof coordinatesSchema>;
