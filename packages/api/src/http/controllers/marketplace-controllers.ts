import { z } from 'zod';
import { createEvents } from '../../utils/create-event';
import {
  getMarketplaceVillage,
  getMerchantAmount,
  getVillageMerchantStats,
} from '../../utils/marketplace';
import { createController } from '../controller';
import { triggerKick } from '../events/scheduler/scheduler-signal';
import {
  createTradeRouteBodySchema,
  transferResourcesBodySchema,
} from './schemas/marketplace-schemas';

const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;

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

export const transferResources = createController(
  '/villages/:villageId/transfer-resources',
  'post',
  {
    summary: 'Transfer resources between player villages',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    requestBody: transferResourcesBodySchema,
  },
)(({ database, path: { villageId }, body: { targetVillageId, resources } }) => {
  database.transaction((db) => {
    const { village, merchant } = getVillageMerchantStats(db, villageId);

    const targetVillage = getMarketplaceVillage(db, targetVillageId);

    if (!targetVillage) {
      throw new Error('Target village does not exist');
    }

    const merchantAmount = getMerchantAmount(
      resources,
      merchant.merchantCapacity,
    );

    createEvents<'resourceTransfer'>(db, {
      type: 'resourceTransfer',
      villageId,
      targetVillageId,
      originTileId: village.tileId,
      targetTileId: targetVillage.tileId,
      resources,
      merchantAmount,
    });
  });
});

export const createTradeRoute = createController(
  '/villages/:villageId/trade-routes',
  'post',
  {
    summary: 'Create a marketplace trade route',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    requestBody: createTradeRouteBodySchema,
  },
)(
  ({
    database,
    path: { villageId },
    body: { targetVillageId, resources, startHour, intervalHours },
  }) => {
    database.transaction((db) => {
      const { village, merchant } = getVillageMerchantStats(db, villageId);
      const targetVillage = getMarketplaceVillage(db, targetVillageId);

      if (!targetVillage) {
        throw new Error('Target village does not exist');
      }

      const merchantAmount = getMerchantAmount(
        resources,
        merchant.merchantCapacity,
      );

      createEvents<'tradeRoute'>(db, {
        type: 'tradeRoute',
        villageId,
        targetVillageId,
        originTileId: village.tileId,
        targetTileId: targetVillage.tileId,
        resources,
        merchantAmount,
        interval: intervalHours * HOUR_IN_MILLISECONDS,
        startsAt: getNextTradeRouteStartsAt(startHour),
      });
    });
  },
);

export const deleteTradeRoute = createController(
  '/villages/:villageId/trade-routes/:eventId',
  'delete',
  {
    summary: 'Delete a marketplace trade route',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
        eventId: z.coerce.number(),
      }),
    },
  },
)(({ database, path: { villageId, eventId } }) => {
  database.exec({
    sql: `
      DELETE
      FROM events
      WHERE id = $event_id
        AND village_id = $village_id
        AND type = 'tradeRoute';
    `,
    bind: {
      $event_id: eventId,
      $village_id: villageId,
    },
  });

  triggerKick();
});
