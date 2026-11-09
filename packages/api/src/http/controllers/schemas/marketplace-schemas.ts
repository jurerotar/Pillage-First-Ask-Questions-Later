import { z } from 'zod';
import { resourcesSchema } from '@pillage-first/types/models/resource';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { tradeRouteScheduleSchema } from '@pillage-first/types/models/trade-route';

const resourceTransferPayloadSchema = z.strictObject({
  targetTileId: tileIdSchema,
  resources: resourcesSchema,
});

export const transferResourcesBodySchema = resourceTransferPayloadSchema.extend(
  {
    repeatCount: z.number().int().min(1).max(5).optional(),
  },
);

export const createTradeRouteBodySchema = tradeRouteScheduleSchema.safeExtend(
  resourceTransferPayloadSchema.shape,
);

export type TradeRouteBody = z.infer<typeof createTradeRouteBodySchema>;

export const tradeRoutePathSchema = z.strictObject({
  routeId: z.coerce.number(),
});
