import type { GameEvent } from '@pillage-first/types/models/game-event';
import {
  getMerchantAmount,
  getTotalResourceAmount,
  getVillageMerchantStats,
} from '../../../utils/marketplace';
import { getTradeRouteById } from '../../../utils/trade-routes';
import { calculateResourceSiteResourcesAt } from '../../../utils/village';
import { defineEventResolver, type Resolver } from '../resolver';

const resolveTradeRoute: Resolver<GameEvent<'tradeRoute'>> = (
  database,
  event,
  createEvents,
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

  if (route.sourcePlayerId === route.targetPlayerId) {
    const currentResources = calculateResourceSiteResourcesAt(
      database,
      originTileId,
      resolvesAt,
    );

    const { currentWood, currentClay, currentIron, currentWheat } =
      currentResources;

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
  }

  // Unexpected failures must reach the scheduler so its transaction/savepoint
  // restores the resources, the consumed trigger and any newly created events.
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

export const tradeRouteResolver = defineEventResolver<'tradeRoute'>(
  (database, event) => ({
    validate: () => {
      const route = getTradeRouteById(database, event.tradeRouteId);

      if (!route || route.paused || route.villageId !== event.villageId) {
        throw new Error('Active trade route does not exist');
      }
    },
    duration: () => 0,
  }),
  resolveTradeRoute,
);
