import { z } from 'zod';
import { tileIdSchema } from '@pillage-first/types/models/tile';

const resourceTransferPayloadSchema = z.strictObject({
  targetTileId: tileIdSchema,
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

export type TradeRouteBody = z.infer<typeof createTradeRouteBodySchema>;

export const tradeRoutePathSchema = z.strictObject({
  tileId: z.coerce.number().pipe(tileIdSchema),
  routeId: z.coerce.number(),
});
