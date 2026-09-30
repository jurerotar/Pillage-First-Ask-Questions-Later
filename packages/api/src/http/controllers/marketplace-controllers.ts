import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  deleteTradeRouteByTileIdQuery,
  updateTradeRouteQuery,
} from '../../queries/marketplace-queries';
import { createEvents } from '../../utils/create-event';
import { validateEventCreationPrerequisites } from '../../utils/events';
import {
  getMarketplaceVillageWithTargetByTileId,
  getMerchantAmount,
  getVillageMerchantStatsWithTargetByTileId,
} from '../../utils/marketplace';
import { createController } from '../controller';
import { triggerKick } from '../events/scheduler/scheduler-signal';
import {
  createTradeRouteBodySchema,
  transferResourcesBodySchema,
} from './schemas/marketplace-schemas';

const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;

type TradeRouteBody = z.infer<typeof createTradeRouteBodySchema>;

const getNextTradeRouteStartsAt = (startHour: number) => {
  const now = Date.now();
  const startsAt = new Date(now);
  startsAt.setMinutes(0, 0, 0);
  startsAt.setHours(startHour);

  if (startsAt.getTime() <= now) {
    startsAt.setDate(startsAt.getDate() + 1);
  }

  return startsAt.getTime();
};

const getTradeRoute = (
  database: DbFacade,
  tileId: number,
  { targetTileId, resources, startHour, intervalHours }: TradeRouteBody,
) => {
  const { village, targetVillage } = getMarketplaceVillageWithTargetByTileId(
    database,
    tileId,
    targetTileId,
  );

  if (!targetVillage) {
    throw new Error('Target village does not exist');
  }

  return {
    startsAt: getNextTradeRouteStartsAt(startHour),
    event: {
      type: 'tradeRoute',
      villageId: village.id,
      targetVillageId: targetVillage.id,
      originTileId: village.tileId,
      targetTileId: targetVillage.tileId,
      resources,
      interval: intervalHours * HOUR_IN_MILLISECONDS,
    } as const,
  };
};

export const transferResources = createController(
  '/tiles/:tileId/transfer-resources',
  'post',
  {
    summary: 'Transfer resources between player villages',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number(),
      }),
    },
    requestBody: transferResourcesBodySchema,
  },
)(
  ({
    database,
    path: { tileId },
    body: { targetTileId, resources, repeatCount = 1 },
  }) => {
    database.transaction((db) => {
      const { village, merchant, targetVillage } =
        getVillageMerchantStatsWithTargetByTileId(db, tileId, targetTileId);

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

export const createTradeRoute = createController(
  '/tiles/:tileId/trade-routes',
  'post',
  {
    summary: 'Create a marketplace trade route',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number(),
      }),
    },
    requestBody: createTradeRouteBodySchema,
  },
)(({ database, path: { tileId }, body }) => {
  database.transaction((db) => {
    const { startsAt, event } = getTradeRoute(db, tileId, body);

    createEvents<'tradeRoute'>(db, { ...event, startsAt });
  });
});

export const updateTradeRoute = createController(
  '/tiles/:tileId/trade-routes/:eventId',
  'patch',
  {
    summary: 'Update a marketplace trade route',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number(),
        eventId: z.coerce.number(),
      }),
    },
    requestBody: createTradeRouteBodySchema,
  },
)(({ database, path: { tileId, eventId }, body }) => {
  database.transaction((db) => {
    const { startsAt, event } = getTradeRoute(db, tileId, body);

    validateEventCreationPrerequisites(db, event as never);

    const updatedRows = db.selectValue({
      sql: updateTradeRouteQuery,
      bind: {
        $event_id: eventId,
        $village_id: event.villageId,
        $starts_at: startsAt,
        $meta: JSON.stringify({
          targetVillageId: event.targetVillageId,
          originTileId: event.originTileId,
          targetTileId: event.targetTileId,
          resources: event.resources,
          interval: event.interval,
        }),
      },
      schema: z.number(),
    });

    if (updatedRows !== 1) {
      throw new Error('Trade route does not exist');
    }
  });

  triggerKick();
});

export const deleteTradeRoute = createController(
  '/tiles/:tileId/trade-routes/:eventId',
  'delete',
  {
    summary: 'Delete a marketplace trade route',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number(),
        eventId: z.coerce.number(),
      }),
    },
  },
)(({ database, path: { tileId, eventId } }) => {
  database.exec({
    sql: deleteTradeRouteByTileIdQuery,
    bind: {
      $event_id: eventId,
      $tile_id: tileId,
    },
  });

  triggerKick();
});
