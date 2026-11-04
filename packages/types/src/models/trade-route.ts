import { z } from 'zod';
import { resourcesSchema } from './resource';

export const tradeRouteSchema = z.strictObject({
  id: z.number(),
  villageId: z.number(),
  targetVillageId: z.number(),
  originTileId: z.number(),
  targetTileId: z.number(),
  resources: resourcesSchema,
  interval: z.number(),
  startsAt: z.number(),
  paused: z.boolean(),
  nextAt: z.number().nullable(),
});

export type TradeRoute = z.infer<typeof tradeRouteSchema>;
