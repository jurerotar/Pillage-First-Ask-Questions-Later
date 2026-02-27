import { z } from 'zod';

export const coordinatesSchema = z
  .strictObject({
    x: z.number(),
    y: z.number(),
  })
  .meta({ id: 'Coordinates' });

export type Coordinates = z.infer<typeof coordinatesSchema>;
