import { z } from 'zod';

export const coordinatesSchema = z
  .strictObject({
    x: z.number(),
    y: z.number(),
  })
  .meta({ id: 'Coordinates' });

export const jsonCoordinatesSchema = z
  .string()
  .transform((value) => JSON.parse(value))
  .pipe(coordinatesSchema);

export type Coordinates = z.infer<typeof coordinatesSchema>;
