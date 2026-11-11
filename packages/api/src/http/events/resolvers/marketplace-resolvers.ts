import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { createEvents } from '../../../utils/create-event';
import {
  getMarketplaceVillageByTileId,
  getMerchantAmount,
  getTotalResourceAmount,
  getVillageMerchantStats,
} from '../../../utils/marketplace';
import { insertTradeReport } from '../../../utils/report';
import { getTradeRouteById } from '../../../utils/trade-routes';
import {
  addResourceSiteResourcesAt,
  calculateResourceSiteResourcesAt,
} from '../../../utils/village';
import type { Resolver } from '../resolver';

export const resourceTransferResolver: Resolver<
  GameEvent<'resourceTransfer'>
> = (database, event) => {
  const {
    villageId,
    targetVillageId,
    originTileId,
    targetTileId,
    resources,
    merchantAmount,
    repeatRemaining,
    repeatResources,
    resolvesAt,
  } = event;

  if (getTotalResourceAmount(resources) === 0) {
    if (repeatRemaining > 0) {
      const nextTargetVillage = getMarketplaceVillageByTileId(
        database,
        originTileId,
      );

      if (nextTargetVillage) {
        try {
          const { merchant } = getVillageMerchantStats(database, villageId);
          const nextMerchantAmount = getMerchantAmount(
            repeatResources,
            merchant.merchantCapacity,
          );

          createEvents<'resourceTransfer'>(database, {
            type: 'resourceTransfer',
            villageId,
            targetVillageId: nextTargetVillage.id,
            originTileId: targetTileId,
            targetTileId: originTileId,
            resources: repeatResources,
            merchantAmount: nextMerchantAmount,
            startsAt: resolvesAt,
            repeatRemaining: repeatRemaining - 1,
            repeatResources,
          });

          return {
            affectedVillageIds: [villageId, nextTargetVillage.id],
            affectedTileIds: [originTileId, targetTileId],
          };
        } catch {
          // Repeated merchant transfers stop when the next leg cannot start.
        }
      }
    }

    return {
      affectedVillageIds: [villageId],
      affectedTileIds: [originTileId, targetTileId],
    };
  }

  addResourceSiteResourcesAt(database, targetTileId, resolvesAt, [
    resources.wood,
    resources.clay,
    resources.iron,
    resources.wheat,
  ]);

  const playerVillageIds = database.selectValues({
    sql: `
      SELECT id FROM villages
      WHERE id IN ($origin_village_id, $target_village_id)
        AND player_id = $player_id;
    `,
    bind: {
      $origin_village_id: villageId,
      $target_village_id: targetVillageId,
      $player_id: PLAYER_ID,
    },
    schema: z.number(),
  });

  const ownsOriginVillage = playerVillageIds.some((id) => id === villageId);

  const ownsTargetVillage = playerVillageIds.some(
    (id) => id === targetVillageId,
  );

  if (ownsOriginVillage && !ownsTargetVillage) {
    insertTradeReport(database, {
      villageId,
      timestamp: resolvesAt,
      outcome: 'outgoingMerchantsArrived',
      originTileId,
      targetTileId,
      resources,
    });
  }

  if (ownsTargetVillage) {
    insertTradeReport(database, {
      villageId: targetVillageId,
      timestamp: resolvesAt,
      outcome: 'incomingMerchantsArrived',
      originTileId,
      targetTileId,
      resources,
    });
  }

  createEvents<'resourceTransfer'>(database, {
    type: 'resourceTransfer',
    villageId,
    targetVillageId: villageId,
    originTileId: targetTileId,
    targetTileId: originTileId,
    resources: {
      wood: 0,
      clay: 0,
      iron: 0,
      wheat: 0,
    },
    merchantAmount,
    startsAt: resolvesAt,
    repeatRemaining,
    repeatResources,
  });

  return {
    affectedVillageIds: [villageId, targetVillageId],
    affectedTileIds: [originTileId, targetTileId],
  };
};

export const tradeRouteResolver: Resolver<GameEvent<'tradeRoute'>> = (
  database,
  event,
) => {
  const route = getTradeRouteById(database, event.tradeRouteId);

  if (!route || route.paused || route.villageId !== event.villageId) {
    return { affectedVillageIds: [], affectedTileIds: [] };
  }

  const {
    villageId,
    targetVillageId,
    originTileId,
    targetTileId,
    resources: requestedResources,
    minimumResources,
    minimumMerchants,
    interval,
  } = route;

  const { resolvesAt } = event;

  try {
    const { currentWood, currentClay, currentIron, currentWheat } =
      calculateResourceSiteResourcesAt(database, originTileId, resolvesAt);

    const resources = {
      wood: Math.min(
        requestedResources.wood,
        Math.max(0, currentWood - minimumResources.wood),
      ),
      clay: Math.min(
        requestedResources.clay,
        Math.max(0, currentClay - minimumResources.clay),
      ),
      iron: Math.min(
        requestedResources.iron,
        Math.max(0, currentIron - minimumResources.iron),
      ),
      wheat: Math.min(
        requestedResources.wheat,
        Math.max(0, currentWheat - minimumResources.wheat),
      ),
    };

    if (getTotalResourceAmount(resources) > 0) {
      const { merchant, marketplaceLevel, usedMerchantAmount } =
        getVillageMerchantStats(database, villageId);
      const merchantAmount = getMerchantAmount(
        resources,
        merchant.merchantCapacity,
      );

      if (
        marketplaceLevel - usedMerchantAmount - merchantAmount >=
        minimumMerchants
      ) {
        createEvents<'resourceTransfer'>(database, {
          type: 'resourceTransfer',
          villageId,
          targetVillageId,
          originTileId,
          targetTileId,
          resources,
          merchantAmount,
          repeatRemaining: 0,
          repeatResources: resources,
          startsAt: resolvesAt,
        });
      }
    }
  } catch {
    // A route miss is expected when resources or free merchants are unavailable.
  }

  createEvents<'tradeRoute'>(database, {
    type: 'tradeRoute',
    tradeRouteId: route.id,
    villageId,
    startsAt: resolvesAt + interval,
  });

  return {
    affectedVillageIds: [villageId, targetVillageId],
    affectedTileIds: [originTileId, targetTileId],
  };
};
