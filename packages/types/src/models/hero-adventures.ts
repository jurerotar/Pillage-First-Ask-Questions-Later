import { z } from 'zod';

export const heroAdventuresSchema = z.strictObject({
  available: z.number(),
  completed: z.number(),
});
