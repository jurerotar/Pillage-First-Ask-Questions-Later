import { z } from 'zod';
import { tradeRouteSchema } from '@pillage-first/types/models/trade-route';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { selectTradeRouteByIdQuery } from '../queries/trade-route-queries';

export const tradeRouteRowSchema = tradeRouteSchema.extend({
  resources: z
    .string()
    .transform((value): unknown => JSON.parse(value))
    .pipe(tradeRouteSchema.shape.resources),
  paused: z.coerce.boolean(),
});

export const getTradeRouteById = (database: DbFacade, routeId: number) => {
  return database.selectObject({
    sql: selectTradeRouteByIdQuery,
    bind: { $route_id: routeId },
    schema: tradeRouteRowSchema,
  });
};
