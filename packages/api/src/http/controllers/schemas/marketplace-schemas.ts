import { z } from 'zod';

const resourceTransferPayloadSchema = z.strictObject({
  targetTileId: z.number().int().positive(),
  resources: z.strictObject({
    wood: z.number().int().min(0),
    clay: z.number().int().min(0),
    iron: z.number().int().min(0),
    wheat: z.number().int().min(0),
  }),
});

export const transferResourcesBodySchema = resourceTransferPayloadSchema.extend(
  {
    repeatCount: z.number().int().min(1).max(5).optional(),
  },
);

export const createTradeRouteBodySchema = resourceTransferPayloadSchema.extend({
  startHour: z.number().int().min(0).max(23),
  intervalHours: z.number().int().positive(),
});
