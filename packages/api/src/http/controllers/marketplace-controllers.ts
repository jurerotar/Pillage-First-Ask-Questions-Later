import { z } from 'zod';
import { createEvents } from '../../utils/create-event';
import { validateEventCreationPrerequisites } from '../../utils/events';
import {
  getMarketplaceVillageByTileId,
  getMerchantAmount,
  getVillageMerchantStatsByTileId,
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
)(({ database, path: { tileId }, body: { targetTileId, resources } }) => {
  database.transaction((db) => {
    const { village, merchant } = getVillageMerchantStatsByTileId(db, tileId);

    const targetVillage = getMarketplaceVillageByTileId(db, targetTileId);

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
    });
  });
});

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
)(
  ({
    database,
    path: { tileId },
    body: { targetTileId, resources, startHour, intervalHours },
  }) => {
    database.transaction((db) => {
      const { village } = getVillageMerchantStatsByTileId(db, tileId);
      const targetVillage = getMarketplaceVillageByTileId(db, targetTileId);

      if (!targetVillage) {
        throw new Error('Target village does not exist');
      }

      createEvents<'tradeRoute'>(db, {
        type: 'tradeRoute',
        villageId: village.id,
        targetVillageId: targetVillage.id,
        originTileId: village.tileId,
        targetTileId: targetVillage.tileId,
        resources,
        interval: intervalHours * HOUR_IN_MILLISECONDS,
        startsAt: getNextTradeRouteStartsAt(startHour),
      });
    });
  },
);

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
)(
  ({
    database,
    path: { tileId, eventId },
    body: { targetTileId, resources, startHour, intervalHours },
  }) => {
    database.transaction((db) => {
      const { village } = getVillageMerchantStatsByTileId(db, tileId);
      const targetVillage = getMarketplaceVillageByTileId(db, targetTileId);

      if (!targetVillage) {
        throw new Error('Target village does not exist');
      }

      const startsAt = getNextTradeRouteStartsAt(startHour);
      const interval = intervalHours * HOUR_IN_MILLISECONDS;
      const nextTradeRoute = {
        type: 'tradeRoute',
        villageId: village.id,
        targetVillageId: targetVillage.id,
        originTileId: village.tileId,
        targetTileId: targetVillage.tileId,
        resources,
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
          $village_id: village.id,
          $starts_at: startsAt,
          $meta: JSON.stringify({
            targetVillageId: targetVillage.id,
            originTileId: village.tileId,
            targetTileId: targetVillage.tileId,
            resources,
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
  const village = getMarketplaceVillageByTileId(database, tileId);

  if (!village) {
    throw new Error('Village does not exist');
  }

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
      $village_id: village.id,
    },
  });

  triggerKick();
});
