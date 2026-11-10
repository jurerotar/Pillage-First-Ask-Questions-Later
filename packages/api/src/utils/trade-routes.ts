import { z } from 'zod';
import {
  type TradeRoute,
  tradeRouteSchema,
} from '@pillage-first/types/models/trade-route';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import type { TradeRouteBody } from '../http/controllers/schemas/marketplace-schemas';
import {
  selectPlayerTradeRouteByIdQuery,
  selectTradeRouteByIdQuery,
  selectTradeRoutesByTileIdQuery,
} from '../queries/trade-route-queries';
import { createEvents } from './create-event';
import {
  getMarketplaceVillage,
  getMarketplaceVillageWithTargetByTileId,
  getMerchantAmount,
  getTotalResourceAmount,
  getVillageMerchantStats,
} from './marketplace';

export const tradeRouteRowSchema = tradeRouteSchema.extend({
  resources: z
    .string()
    .transform((value): unknown => JSON.parse(value))
    .pipe(tradeRouteSchema.shape.resources),
  minimumResources: z
    .string()
    .transform((value): unknown => JSON.parse(value))
    .pipe(tradeRouteSchema.shape.minimumResources),
  paused: z.coerce.boolean(),
});

export const getTradeRouteById = (database: DbFacade, routeId: number) => {
  return database.selectObject({
    sql: selectTradeRouteByIdQuery,
    bind: { $route_id: routeId },
    schema: tradeRouteRowSchema,
  });
};

export const scheduleTradeRoute = (
  database: DbFacade,
  routeId: number,
  villageId: number,
  startsAt: number,
) => {
  createEvents<'tradeRoute'>(database, {
    type: 'tradeRoute',
    tradeRouteId: routeId,
    villageId,
    startsAt,
  });
};

export const getTradeRoutes = (
  database: DbFacade,
  tileId: number,
  playerId: number,
) => {
  return database.selectObjects({
    sql: selectTradeRoutesByTileIdQuery,
    bind: { $tile_id: tileId, $player_id: playerId },
    schema: tradeRouteRowSchema,
  });
};

export const validateTradeRoute = (
  database: DbFacade,
  route: Omit<TradeRoute, 'id' | 'paused' | 'nextAt'>,
) => {
  const { village, merchant, marketplaceLevel } = getVillageMerchantStats(
    database,
    route.villageId,
  );
  const targetVillage = getMarketplaceVillage(database, route.targetVillageId);

  if (!targetVillage || targetVillage.playerId !== village.playerId) {
    throw new Error(
      'Target village does not exist or does not belong to player',
    );
  }

  if (route.targetVillageId === route.villageId) {
    throw new Error('Target village must be different from source village');
  }

  if (village.tileId !== route.originTileId) {
    throw new Error('Origin tile does not belong to source village');
  }

  if (targetVillage.tileId !== route.targetTileId) {
    throw new Error('Target tile does not belong to target village');
  }

  if (getTotalResourceAmount(route.resources) <= 0) {
    throw new Error('Trade route must include resources');
  }

  if (!Number.isFinite(route.interval) || route.interval <= 0) {
    throw new Error('Trade route interval must be positive');
  }

  const merchantAmount = getMerchantAmount(
    route.resources,
    merchant.merchantCapacity,
  );

  if (merchantAmount > marketplaceLevel) {
    throw new Error('Not enough merchants');
  }
};

const getNextTradeRouteStartsAt = (startHour: number, startMinute: number) => {
  const now = Date.now();
  const startsAt = new Date(now);
  startsAt.setHours(startHour, startMinute, 0, 0);

  if (startsAt.getTime() <= now) {
    startsAt.setDate(startsAt.getDate() + 1);
  }

  return startsAt.getTime();
};

export const getTradeRoute = (
  database: DbFacade,
  tileId: number,
  body: TradeRouteBody,
  playerId: number,
) => {
  const {
    targetTileId,
    resources,
    minimumResources,
    minimumMerchants,
    startHour,
    startMinute,
    intervalHours,
    intervalMinutes,
  } = body;

  const { village, targetVillage } = getMarketplaceVillageWithTargetByTileId(
    database,
    tileId,
    targetTileId,
  );

  if (village.playerId !== playerId) {
    throw new Error('Source village does not belong to player');
  }

  if (!targetVillage) {
    throw new Error('Target village does not exist');
  }

  return {
    startsAt: getNextTradeRouteStartsAt(startHour, startMinute),
    event: {
      type: 'tradeRoute',
      villageId: village.id,
      targetVillageId: targetVillage.id,
      originTileId: village.tileId,
      targetTileId: targetVillage.tileId,
      resources,
      minimumResources,
      minimumMerchants,
      interval: (intervalHours * 60 + intervalMinutes) * 60 * 1000,
    } as const,
  };
};

export const requireTradeRoute = (
  database: DbFacade,
  playerId: number,
  routeId: number,
) => {
  const route = database.selectObject({
    sql: selectPlayerTradeRouteByIdQuery,
    bind: { $route_id: routeId, $player_id: playerId },
    schema: tradeRouteRowSchema,
  });

  if (!route) {
    throw new Error('Trade route does not exist');
  }

  return route;
};
