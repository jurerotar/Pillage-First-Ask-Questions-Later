import { z } from 'zod';
import { createEvents } from '../../utils/create-event';
import { validateEventCreationPrerequisites } from '../../utils/events';
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

export const updateTradeRoute = createController(
  '/villages/:villageId/trade-routes/:eventId',
  'patch',
  {
    summary: 'Update a marketplace trade route',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
        eventId: z.coerce.number(),
      }),
    },
    requestBody: createTradeRouteBodySchema,
  },
)(
  ({
    database,
    path: { villageId, eventId },
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
      const startsAt = getNextTradeRouteStartsAt(startHour);
      const interval = intervalHours * HOUR_IN_MILLISECONDS;
      const nextTradeRoute = {
        type: 'tradeRoute',
        villageId,
        targetVillageId,
        originTileId: village.tileId,
        targetTileId: targetVillage.tileId,
        resources,
        merchantAmount,
        interval,
      } as const;

      validateEventCreationPrerequisites(db, nextTradeRoute as never);

      const updatedRows = db.selectValue({
        sql: `
          UPDATE events
          SET
            starts_at = $starts_at,
            meta = $meta
          WHERE id = $event_id
            AND village_id = $village_id
            AND type = 'tradeRoute'
          RETURNING changes();
        `,
        bind: {
          $event_id: eventId,
          $village_id: villageId,
          $starts_at: startsAt,
          $meta: JSON.stringify({
            targetVillageId,
            originTileId: village.tileId,
            targetTileId: targetVillage.tileId,
            resources,
            merchantAmount,
            interval,
          }),
        },
        schema: z.number(),
      });

      if (updatedRows !== 1) {
        throw new Error('Trade route does not exist');
      }
    });

    triggerKick();
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
