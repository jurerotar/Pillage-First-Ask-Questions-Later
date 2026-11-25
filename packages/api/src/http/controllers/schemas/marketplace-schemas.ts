import { z } from 'zod';
import { resourcesSchema } from '@pillage-first/types/models/resource';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import {
  tradeRouteIntervalCheck,
  tradeRouteScheduleSchema,
  tradeRouteSchema,
} from '@pillage-first/types/models/trade-route';

const resourceTransferPayloadSchema = z.strictObject({
  targetTileId: tileIdSchema,
  resources: resourcesSchema,
});

export const transferResourcesBodySchema = z.strictObject({
  ...resourceTransferPayloadSchema.shape,
  repeatCount: z.number().int().min(1).max(5).optional(),
});

export const createTradeRouteBodySchema = z
  .strictObject({
    ...tradeRouteScheduleSchema.shape,
    ...resourceTransferPayloadSchema.shape,
    resources: resourcesSchema.refine(
      ({ wood, clay, iron, wheat }) => wood + clay + iron + wheat > 0,
      { message: 'Trade route must include resources' },
    ),
    minimumMerchants: tradeRouteSchema.shape.minimumMerchants,
    minimumResources: resourcesSchema,
  })
  .check(tradeRouteIntervalCheck);

export type TradeRouteBody = z.infer<typeof createTradeRouteBodySchema>;

export const tradeRoutePathSchema = z.strictObject({
  routeId: z.coerce.number(),
});
