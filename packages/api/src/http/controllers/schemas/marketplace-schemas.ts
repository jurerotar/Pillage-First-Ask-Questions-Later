import { z } from 'zod';

export const transferResourcesBodySchema = z.strictObject({
  targetTileId: z.number().int().positive(),
  resources: z.strictObject({
    wood: z.number().int().min(0),
    clay: z.number().int().min(0),
    iron: z.number().int().min(0),
    wheat: z.number().int().min(0),
  }),
});

export const createTradeRouteBodySchema = transferResourcesBodySchema.extend({
  startHour: z.number().int().min(0).max(23),
  intervalHours: z.number().int().positive(),
});
