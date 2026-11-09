import { z } from 'zod';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { tradeRouteSchema } from '@pillage-first/types/models/trade-route';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  deleteTradeRouteEventQuery,
  deleteTradeRouteQuery,
  insertTradeRouteQuery,
  setTradeRoutePausedQuery,
  updateTradeRouteQuery,
} from '../../queries/trade-route-queries';
import { createEvents } from '../../utils/create-event';
import {
  getMerchantAmount,
  getVillageMerchantStatsWithTargetByTileId,
} from '../../utils/marketplace';
import {
  getTradeRoute,
  getTradeRoutes,
  requireTradeRoute,
  validateTradeRoute,
} from '../../utils/trade-routes';
import { createController } from '../controller';
import { triggerKick } from '../events/scheduler/scheduler-signal';
import {
  createTradeRouteBodySchema,
  tradeRoutePathSchema,
  transferResourcesBodySchema,
} from './schemas/marketplace-schemas';

const scheduleTradeRoute = (
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

export const transferResources = createController(
  '/tiles/:tileId/transfer-resources',
  'post',
  {
    summary: 'Transfer resources between player villages',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number().pipe(tileIdSchema),
      }),
    },
    requestBody: transferResourcesBodySchema,
  },
)(
  ({
    database,
    context: { playerId },
    path: { tileId },
    body: { targetTileId, resources, repeatCount = 1 },
  }) => {
    database.transaction((db) => {
      const { village, merchant, targetVillage } =
        getVillageMerchantStatsWithTargetByTileId(db, tileId, targetTileId);

      if (village.playerId !== playerId) {
        throw new Error('Source village does not belong to player');
      }

      if (!targetVillage) {
        throw new Error('Target village does not exist');
      }

      const merchantAmount = getMerchantAmount(
        resources,
        merchant.merchantCapacity,
      );

      createEvents<'resourceTransfer'>(db, {
        type: 'resourceTransfer',
        villageId: village.id,
        targetVillageId: targetVillage.id,
        originTileId: village.tileId,
        targetTileId: targetVillage.tileId,
        resources,
        merchantAmount,
        repeatRemaining: repeatCount - 1,
        repeatResources: resources,
      });
    });
  },
);

export const listTradeRoutes = createController('/tiles/:tileId/trade-routes', {
  summary: 'Get saved marketplace trade routes',
  requestParams: {
    path: z.strictObject({
      tileId: z.coerce.number().pipe(tileIdSchema),
    }),
  },
  response: z.array(tradeRouteSchema),
})(({ database, context: { playerId }, path: { tileId } }) => {
  return getTradeRoutes(database, tileId, playerId);
});

export const createTradeRoute = createController(
  '/tiles/:tileId/trade-routes',
  'post',
  {
    summary: 'Create a marketplace trade route',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number().pipe(tileIdSchema),
      }),
    },
    requestBody: createTradeRouteBodySchema,
  },
)(({ database, context: { playerId }, path: { tileId }, body }) => {
  database.transaction((db) => {
    const { startsAt, event } = getTradeRoute(db, tileId, body, playerId);

    validateTradeRoute(db, { ...event, startsAt });

    const routeId = db.selectValue({
      sql: insertTradeRouteQuery,
      bind: {
        $village_id: event.villageId,
        $target_village_id: event.targetVillageId,
        $resources: JSON.stringify(event.resources),
        $interval: event.interval,
        $starts_at: startsAt,
      },
      schema: z.number(),
    })!;

    scheduleTradeRoute(db, routeId, event.villageId, startsAt);
  });
});

export const updateTradeRoute = createController(
  '/trade-routes/:routeId',
  'patch',
  {
    summary: 'Update a marketplace trade route',
    requestParams: { path: tradeRoutePathSchema },
    requestBody: createTradeRouteBodySchema,
  },
)(({ database, context: { playerId }, path: { routeId }, body }) => {
  database.transaction((db) => {
    const route = requireTradeRoute(db, playerId, routeId);

    const { startsAt, event } = getTradeRoute(
      db,
      route.originTileId,
      body,
      playerId,
    );

    validateTradeRoute(db, { ...event, startsAt });

    db.exec({
      sql: updateTradeRouteQuery,
      bind: {
        $route_id: routeId,
        $target_village_id: event.targetVillageId,
        $resources: JSON.stringify(event.resources),
        $interval: event.interval,
        $starts_at: startsAt,
      },
    });

    db.exec({
      sql: deleteTradeRouteEventQuery,
      bind: { $route_id: routeId },
    });

    if (!route.paused) {
      scheduleTradeRoute(db, routeId, route.villageId, startsAt);
    }
  });

  triggerKick();
});

export const setTradeRoutePaused = createController(
  '/trade-routes/:routeId/paused',
  'patch',
  {
    summary: 'Pause or resume a marketplace trade route',
    requestParams: { path: tradeRoutePathSchema },
    requestBody: z.strictObject({ paused: z.boolean() }),
  },
)(
  ({
    database,
    context: { playerId },
    path: { routeId },
    body: { paused },
  }) => {
    database.transaction((db) => {
      const route = requireTradeRoute(db, playerId, routeId);

      if (route.paused === paused) {
        return;
      }

      db.exec({
        sql: setTradeRoutePausedQuery,
        bind: { $route_id: routeId, $paused: Number(paused) },
      });

      if (paused) {
        db.exec({
          sql: deleteTradeRouteEventQuery,
          bind: { $route_id: routeId },
        });
      } else {
        const now = Date.now();
        const startsAt =
          route.startsAt > now
            ? route.startsAt
            : route.startsAt +
              (Math.floor((now - route.startsAt) / route.interval) + 1) *
                route.interval;

        scheduleTradeRoute(db, routeId, route.villageId, startsAt);
      }
    });

    triggerKick();
  },
);

export const deleteTradeRoute = createController(
  '/trade-routes/:routeId',
  'delete',
  {
    summary: 'Delete a marketplace trade route',
    requestParams: { path: tradeRoutePathSchema },
  },
)(({ database, context: { playerId }, path: { routeId } }) => {
  database.transaction((db) => {
    requireTradeRoute(db, playerId, routeId);

    db.exec({
      sql: deleteTradeRouteEventQuery,
      bind: { $route_id: routeId },
    });

    db.exec({
      sql: deleteTradeRouteQuery,
      bind: { $route_id: routeId },
    });
  });

  triggerKick();
});
