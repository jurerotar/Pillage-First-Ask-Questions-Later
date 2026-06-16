import { z } from 'zod';

export const transferResourcesBodySchema = z.strictObject({
  targetVillageId: z.number().int().positive(),
  resources: z.strictObject({
    wood: z.number().int().min(0),
    clay: z.number().int().min(0),
    iron: z.number().int().min(0),
    wheat: z.number().int().min(0),
  }),
});
